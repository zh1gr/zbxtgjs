var Telegram = {
    token: null,
    to: null,
    topic: null,
    message: null,
    proxy: null,
    parse_mode: null,

    escapeMarkup: function (str, mode) {
        switch (mode) {
            case 'markdown':
                return str.replace(/([_*\[`])/g, '\\$&');

            case 'markdownv2':
                return str.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$&');

            case 'html':
                return str.replace(/<(\s|[^a-z\/])/g, '&lt;$1');

            default:
                return str;
        }
    },

    sendMessage: function () {
        var params = {
                chat_id: Telegram.to,
                message_thread_id: Telegram.topic,
                text: Telegram.message,
                disable_web_page_preview: true,
                disable_notification: false
            },
            data,
            response,
            request = new CurlHttpRequest(),
            url = 'https://api.telegram.org/bot' + Telegram.token + '/sendMessage';

        //modification from github.com/zh1gr

        if (Telegram.proxy) {
            request.SetProxy(Telegram.proxy);
        }

        request.AddHeader('Content-Type: application/json');
        data = JSON.stringify(params);

        // Remove replace() function if you want to see the exposed token in the log file.
        Zabbix.Log(4, '[Telegram Webhook] URL: ' + url.replace(Telegram.token, '<TOKEN>'));
        Zabbix.Log(4, '[Telegram Webhook] params: ' + data);
        response = request.Post(url, data);
        Zabbix.Log(4, '[Telegram Webhook] HTTP code: ' + request.Status());

        try {
            response = JSON.parse(response);
        } catch (error) {
            response = null;
        }

        if (request.Status() !== 200 || typeof response.ok !== 'boolean' || response.ok !== true) {
            if (typeof response.description === 'string') {
                throw response.description;
            } else {
                throw 'Unknown error. Check debug log for more information.';
            }
        }
    }
};

try {
    var params = JSON.parse(value);

    if (typeof params.Token === 'undefined') {
        throw 'Incorrect value is given for parameter "Token": parameter is missing';
    }

    Telegram.token = params.Token;

    if (params.HTTPProxy) {
        Telegram.proxy = params.HTTPProxy;
    }

    if (params.Topic) {
        Telegram.topic = params.Topic
    }

    Telegram.to = params.To;
    Telegram.message = params.Subject + '\n' + params.Message;

    if (['markdown', 'html', 'markdownv2'].indexOf(params.ParseMode) !== -1) {
        Telegram.parse_mode = params.ParseMode;
        Telegram.message = Telegram.escapeMarkup(Telegram.message, params.ParseMode);
    }

    Telegram.sendMessage();

    return 'OK';
} catch (error) {
    Zabbix.Log(4, '[Telegram Webhook] notification failed: ' + error);
    throw 'Sending failed: ' + error + '.';
}