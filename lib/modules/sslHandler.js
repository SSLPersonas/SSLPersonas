/**
 * Created by tobi on 22/11/14.
 */

function sslHandler(){

    /**
     * Use this to set the generally possible SSL statuses in your apps.
     * @type {{extendedValidation: string, standardValidation: string, brokenCertificate: string, insecureConnection: string, otherProtocol: string}}
     */
    this.SSL_STATUS = {
        extendedValidation: 'extendedValidation',
        standardValidation: 'standardValidation',
        brokenCertificate: 'brokenCertificate',
        insecureConnection: 'insecureConnection',
        otherProtocol: 'otherProtocol'
    };

    this.getSSLStatus = function() {
        var utils = require('sdk/window/utils');

        // it might seem a little cumbersome to have two separate variables for this.
        // but it might also seem a little counterintuitive to have the colo inside the protocol
        // this is a way to _avoid_ errors.
        var protocols = {http: 'http:', https: 'https:'};
        var relevantProtocols = [protocols.http, protocols.https];

        // this is the most recently used browser window

        var activeWindow = utils.getMostRecentBrowserWindow();

        // some IDEs don't accept that .getBrowser() is actually a method, but it is on FF > //TODO what version?
        var securityUI = activeWindow.getBrowser().securityUI;

        // we're using some irrelevant protocol, e.g. file:
        if (relevantProtocols.indexOf(activeWindow.content.location.protocol) == -1) {
            return this.SSL_STATUS.otherProtocol;
        }

        // we're not using SSL at all --> http connection
        if(!securityUI.SSLStatus){
            return this.SSL_STATUS.insecureConnection;
        }
        // there is at least something similar to an SSL Status.
        else{
            // now unwrap the most important flags. Let's just hope that no one tampers with that.
            var {isNotValidAtThisTime,isUntrusted,isExtendedValidation,isDomainMismatch} = securityUI.SSLStatus;

            // this is important.
            // the isNotValidAtThis time flag needs to be checked right at the beginning
            // because if the certificate is not valid at this time, its SSL Level doesn't matter!
            if(isNotValidAtThisTime || isDomainMismatch){
                return this.SSL_STATUS.brokenCertificate;
            }

            // this is reliable.
            if(isExtendedValidation){
                return this.SSL_STATUS.extendedValidation;
            }

            // this is somewhat nasty.
            // only because it's not untrusted, it shouldn't mean we automatically trust it.
            // those double negatives drive you insane.
            if(!isUntrusted){
                return this.SSL_STATUS.standardValidation;
            }
        }
    }
};

exports.sslHandler = new sslHandler();