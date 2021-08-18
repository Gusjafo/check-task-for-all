const msal = require('@azure/msal-node');

const config = {
    auth: {
        clientId: process.env.CLIENTID, //Id. de aplicación (cliente)
        authority: "https://login.microsoftonline.com/common",
        clientSecret: process.env.CLIENTSECRET  //Valor secreto (cliente)
    },
    system: {
        loggerOptions: {
            loggerCallback(loglevel, message, containsPii) {
                console.log(message);
            },
            piiLoggingEnabled: false,
            logLevel: msal.LogLevel.Verbose,
        }
    }
};

module.exports = new msal.ConfidentialClientApplication(config);
