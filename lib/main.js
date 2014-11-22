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


(function () { // Begin (anonymous) namespace / scope
    var lastSSLStatus;
    var themeSwitcher = require('./modules/themeSwitcher.js').themeSwitcher;
    var sslHandler = require('./modules/sslHandler.js').sslHandler;

    /**
     * Is triggered whenever the user interacts with tabs.
     * @callback for a lot of tab-change related stuff.
     */
    function chromeInteractionCallback() {
        var sslStatus = sslHandler.getSSLStatus();
        if (lastSSLStatus != sslStatus) {
            lastSSLStatus = sslStatus;
            themeSwitcher.switchToTheme(themeSwitcher.theme[sslStatus]);
        }
    }


    /**
     * Initializes all tab listeners/callbacks.
     * Basically, we add the sslCheck to all tab-related user interactions.
     */
    function initTabListeners() {
        // a reference to the tabs module / interface
        var tabs = require('sdk/tabs');
        tabs.on('ready', chromeInteractionCallback);
        tabs.on('activate', chromeInteractionCallback);
        tabs.on('load', chromeInteractionCallback);
        tabs.on('pageshow', chromeInteractionCallback);
        tabs.on('open', chromeInteractionCallback);
    }

    /**
     * Initializes all _window_ listeners/callbacks.
     * Basically, we add the sslCheck to all window-related user interactions.
     */
    function initWindowListeners(){
        var windows = require('sdk/windows');
        windows.on('activate', chromeInteractionCallback);
        windows.on('deactivate', chromeInteractionCallback);
    }



    /***
     *
     * This is where the actual magic happens.
     *
     */

    initTabListeners();

})(); // End (anonymous) namespace. Call the function.