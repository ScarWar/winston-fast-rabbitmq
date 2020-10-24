import * as Transport from 'winston-transport';
import * as rabbitChatter from 'rabbit-chatter';

export interface RabbitMQTransportOptions extends Transport.TransportStreamOptions {
    appId?: string;
    durable?: boolean;
    exchangeName?: string;
    exchangeType: string;
    host?: string;
    password?: string;
    port?: number;
    protocol?: string;
    routingKey?: string;
    timeout?: number;
    username?: string;
    virtualHost?: string;

    handleError?(err: any): void;
}

export class RabbitMQTransport extends Transport {
    private _rabbit: any;

    constructor(options: RabbitMQTransportOptions) {
        super(options);
        this.initializeRabbitMQConnection(options);
    }

    private initializeRabbitMQConnection(options: RabbitMQTransportOptions): void {
        const rabbitOptions = {
            appId: options.appId,
            silent: options.silent,
            exchangeType: options.exchangeType,
            exchangeName: options.exchangeName || 'winston-log',
            durable: options.durable,
            protocol: options.protocol || 'amqp',
            username: options.username || 'guest',
            password: options.password || 'guest',
            host: options.host || 'localhost',
            virtualHost: options.virtualHost ? options.virtualHost : '',
            port: options.port || 5672,
            routingKey: options.routingKey || '',
            timeout: options.timeout || 1000,
            handleError: options.handleError,
        };
        this._rabbit = rabbitChatter.rabbit(rabbitOptions);
    }

    log(info: any, next: () => void): any {
        setImmediate(() => this.emit('logged', info));
        this._rabbit.chat(JSON.stringify(info))
        next();
    }
}

// @ts-ignore
// winston.transports.RabbitMQ = RabbitMQTransport;