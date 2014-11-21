/**
 *
 * SSLPersonas
 * Originally Written by Tobias Stockinger - tobi@tobitobi.de
 * Rewritten in 11/2014.
 *
 * 3rd Party Code:
 * jQuery - https://code.jquery.com/jquery-2.1.1.min.js - licensed under the MIT License
 *
 * Credits:
 * Chris Beard <cbeard@mozilla.org> for Personas Plus Addon. It was a huge help.
 * Andras Tim <andras.tim@gmail.com> for New MitM Me Addon (Bypass Concept).
 * Martin Esche for showing me how easy the switch to JetPack was.
 * Max-Emanuel Maurer and Alexander de Luca for their consultation a couple of years ago ;)
 *
 * Licensed (C) 2014 under the MIT License
 * See LICENSE for further information.
 */

(function(){ // Begin (anonymous) namespace / scope



    /***
     *
     * Functions / Objects
     *
     */

    function getSSLStatus() {
        var utils = require('sdk/window/utils');
        var window = utils.getMostRecentBrowserWindow();
        const {Cc, Ci} = require("chrome");
        const gb = window.getBrowser();
        var currentBrowser = gb.selectedBrowser;
        var ui = currentBrowser.securityUI;
        var insecureSSL = (ui.state & Ci.nsIWebProgressListener.STATE_IS_INSECURE);
        var urlProtocol = window.content.location.protocol;
        var hostName = window.content.location.hostname;
        var toReturn = "nonSSL";

        if (urlProtocol == "https:") {

            // collect the certificate information
            if (ui && !insecureSSL)  {
                ui.QueryInterface(Ci.nsISSLStatusProvider);
                var status = ui.SSLStatus;
                if (!status) return;
                var sslCert = status.serverCert;
                if (!(sslCert)) return;
                var dateValidity = sslCert.validity.QueryInterface(Ci.nsIX509CertValidity);
                var sslCertVerification;
                if (status && !insecureSSL) {
                    status.QueryInterface(Ci.nsISSLStatus);
                }
            }

            // Check ssl certificate security state flags
            if (Ci.nsIWebProgressListener.STATE_IS_SECURE) {
                sslCertVerification = "Verified";
                toReturn = "SSL";
            } else if (Ci.nsIWebProgressListener.STATE_IS_INSECURE) {
                sslCertVerification = "WARNING! not trusted";
            } else {
                sslCertVerification = "WARNING! broken";
            }

            // does the url hostname and certificate common name match?
            var hostsMatch = " (DOMAIN MISMATCH!)";
            if (! sslCert.isDomainMismatch) {
                hostsMatch = " (matched)";
            } else {
                toReturn = "nonSSL";
            }

        } else if (urlProtocol == "http:"){
            if (hostName == ignoredHost) {
                //the "Warnung einmal ignorieren" button sets the ignoredHost so it doesn't break the streak
                toReturn = "ignore";
            }
            //if the current host is in the ignoredHosts Array, just adjust the theme without breaking the streak
            for (var i = 0; i < ss.storage.ignoredHosts.length; i++) {
                if (hostName == ss.storage.ignoredHosts[i]) {
                    toReturn = "ignore";
                }
            }
        } else {
            //triggers for all non-http/https protocols since we can't interact with them
            toReturn = "nonHTTP";
        }
        currentHost = hostName;
        return toReturn;
    }


    /**
     * @callback for a lot of tab-change related stuff.
     */
    function sslCheck(){

    }


    function initTabListeners(){
        // a reference to the tabs module / interface
        var tabs = require('sdk/tabs');

        tabs.on('activate',sslCheck);
        tabs.on('load',sslCheck);
        tabs.on('ready',sslCheck);
        tabs.on('pageshow',sslCheck);
    }





    /***
     *
     * This is where the actual magic happens.
     *
     */

})(); // End (anonymous) namespace. Call the function.