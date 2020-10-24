import * as winston from 'winston';
import * as chai from 'chai';
import * as amqplib from 'amqplib';
import {RabbitMQTransport} from '../src/winston-rabbitmq';

const assert = chai.assert;
const expect = chai.expect;

describe('Winston connection', () => {
    describe('Test if log is send to RabbitMQ', function () {
        this.timeout(7000);

        const transportOptions = {
            appId: 'winston-transport-test',
            protocol: 'amqp',
            username: 'admin',
            password: 'admin2017',
            host: 'localhost',
            port: 5672,
            silent: false,
            exchangeName: 'TEST',
            exchangeType: 'topic',
            durable: false,
            level: null
        }

        winston.add(new RabbitMQTransport(transportOptions));
        winston.remove(winston.transports.Console);

        it('should return the correct messages from queue', (done) => {
            transportOptions.level = 'error';

            let connection;
            let connectionCloseTimerId;
            let msgCount = 0;

            setTimeout(() => {
                winston.error('TESTERROR');
            }, 50);
            amqplib
                .connect(`${transportOptions.protocol}://${transportOptions.username}:${transportOptions.password}@${transportOptions.host}/`)
                .then((conn) => {
                    connection = conn;
                    return conn.createChannel();
                })
                .then((channel) => {
                    return channel.assertExchange(
                        transportOptions.exchangeName,
                        transportOptions.exchangeType,
                        {durable: transportOptions.durable})
                        .then((ok) => {
                            return channel.assertQueue('', {exclusive: true})
                                .then((q) => {
                                    channel.bindQueue(q.queue, transportOptions.exchangeName, '');

                                    return channel.consume(q.queue, (msg) => {

                                        msgCount++;

                                        clearTimeout(connectionCloseTimerId);

                                        connectionCloseTimerId = setTimeout(() => {
                                            const jsonMessage = JSON.parse(msg.content.toString());
                                            expect(jsonMessage.message).to.equal('TESTERROR');
                                            expect(msgCount).to.equal(1);

                                            connection.close();

                                            done();
                                        }, 500);

                                    }, {noAck: true});
                                })

                        });
                })
                .catch((ex) => {
                    throw ex;
                });
        });
    });
});