/**
 *
 * SSLPersonas
 * Originally written by Tobias Stockinger - tobi@tobitobi.de
 * Rewritten in 11/2014.
 *
 *
 * 3rd Party Code:
 * jQuery - https://code.jquery.com/jquery-2.1.1.min.js - licensed under the MIT License
 *
 * Credits:
 * Chris Beard <cbeard@mozilla.org> for Personas Plus Addon. Looking at its code was a huge help.
 * Andras Tim <andras.tim@gmail.com> for New MitM Me Addon (Bypass Concept).
 * Martin Esche for showing me how easy the switch to JetPack was.
 * Max-Emanuel Maurer and Alexander de Luca for their consultation a couple of years ago ;)
 *
 * Licensed (C) 2014 under the MIT License
 * See LICENSE for further information.
 *
 * The source is available on GitHub
 * https://github.com/TobiasStockinger/SSLPersonas
 */


(function () { // Begin (anonymous) namespace / scope
    var lastSSLStatus;
    var { viewFor } = require("sdk/view/core");
    var themeSwitcher = require('./modules/themeSwitcher.js').themeSwitcher;
    var sslHandler = require('./modules/sslHandler.js').sslHandler;

    /**
     * Is triggered whenever the user interacts with tabs.
     * @callback for a lot of tab-change related stuff.
     */
    function chromeInteractionCallback(window) {
        var sslStatus = sslHandler.getSSLStatus(window);
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
        var currentEvent;

        // a reference to the tabs module / interface
        var tabs = require('sdk/tabs');

        // we attach our callback to those events. Other potential candidates: 'open'
        var handledEvents = ['ready','activate','load','pageshow'];
        var eventCount = handledEvents.length; // performance paranoia.

        // now iterate over all events and attach an according listener to the tabs.
        for(var i=0;i<eventCount;i++){
            (function(event){
                tabs.on(event,function(tab){
                    var window = viewFor(tab.window);
                    chromeInteractionCallback(window);
                })
            })(handledEvents[i]);
        }
    }

    /**
     * Initializes all _window_ listeners/callbacks.
     * Basically, we add the sslCheck to all window-related user interactions.
     */
    function initWindowListeners(){
        var windows = require('sdk/windows').browserWindows;
        windows.on('activate', function(window){
            chromeInteractionCallback(viewFor(window));
        });
    }



    /***
     *
     * This is where the actual magic happens.
     *
     */
    initTabListeners();
    initWindowListeners();
    lastSSLStatus = sslHandler.getSSLStatus();

})(); // End (anonymous) namespace. Call the function.