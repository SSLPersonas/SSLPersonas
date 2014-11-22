/**
 * Created by Tobi Stockinger on 22/11/14.
 */

/**
 * This module provides an easy interface to a window's respectively tab's SSL status
 * It knows 5 different states that are declared in its SSL_STATUS attribute.
 *
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

    /**
     * Checks the current tab's SSL status.
     * @param window the window to be checked. If null, the most recent browser window is used.
     * @returns {string|*} constant from sslHandler.SSL_STATUS
     */
    this.getSSLStatus = function(window) {
        var progressListener;
        var utils = require('sdk/window/utils');


        // it might seem a little cumbersome to have two separate variables for this.
        // but it might also seem a little awkward to have the colon inside the protocol name.
        // this is a way to _avoid_ errors.
        var protocols = {http: 'http:', https: 'https:'};
        var relevantProtocols = [protocols.http, protocols.https];



        // either use what we get from the callback or try and access the most recently used browser window
        var activeWindow = window || utils.getMostRecentBrowserWindow();

        // some IDEs don't accept that .getBrowser() is actually a method, but it is on FF > //TODO what version?
        var securityUI = activeWindow.getBrowser().securityUI;

        // the securityUI has a state field.
        // this state field should take the values described here:
        // https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIWebProgressListener#State_Security_Flags
        // however, there is one case (standard validation)
        // where the bit mask isn't working: 262146
        // FIXME once this Firefox bug (?) has been resolved
        // for now, we just assume that this magic Trusted State is indeed trustworthy,
        // so we can return a SSL_STATUS.standardValidation.
        var magicTrustedState = 262146;

        // we're using some irrelevant protocol, e.g. file:
        if (relevantProtocols.indexOf(activeWindow.content.location.protocol) == -1) {
            return this.SSL_STATUS.otherProtocol;
        }

        // we're not using SSL at all --> http connection
        if(!securityUI.SSLStatus){

            // there is a slight chance that the page DOES use SSL
            // but Firefox fails to deliver an SSLStatus Object
            // to reproduce that: try switching applications forth and back
            // at some point, the SSLStatus is missing.

            // we try to alleviate the problem by bitmask-checking for STATE_IS_SECURE and magicTrustedState
            if(securityUI.state){
                progressListener = require('chrome').Ci.nsIWebProgressListener;
                if(progressListener.STATE_IS_SECURE & securityUI.state && securityUI.state == magicTrustedState){
                    console.log('Info: assuming magicTrustedState! This is usually harmless.');
                    return this.SSL_STATUS.standardValidation;
                }
            }
            return this.SSL_STATUS.insecureConnection;
        }
        // there is at least something similar to an SSL Status.
        else{
            // now unwrap the most important flags. Let's just hope that no one tampers with that.
            var {isNotValidAtThisTime,isUntrusted,isExtendedValidation,isDomainMismatch} = securityUI.SSLStatus;

            // this is important! Do not change this hastily.
            // the isNotValidAtThis time flag needs to be checked right at the beginning
            // because if the certificate is not valid at this time, its SSL Level doesn't matter!
            if(isNotValidAtThisTime || isDomainMismatch){
                return this.SSL_STATUS.brokenCertificate;
            }

            // this has been perceived as quite reliable.
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
}

exports.sslHandler = new sslHandler();