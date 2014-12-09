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
    var themeSwitcher = require('./modules/themeSwitcher').themeSwitcher;
    var sslHandler = require('./modules/sslHandler').sslHandler;
    var data = require('sdk/self').data;


    /**
     * Is triggered whenever the user interacts with tabs.
     * @callback for a lot of tab-change related stuff.
     */
    function chromeInteractionCallback(window) {
        var sslStatus = sslHandler.getSSLStatus(window);
        var newTheme;
        // let's only switch if the status has changed.
        if (lastSSLStatus != sslStatus) {
            lastSSLStatus = sslStatus;
            newTheme = themeSwitcher.theme[sslStatus];
            themeSwitcher.switchToTheme(newTheme);
        }
    }



    /**
     * Initializes all tab listeners/callbacks.
     * Basically, we add the sslCheck to all tab-related user interactions.
     */
    function initTabListeners() {
        // a reference to the tabs module / interface
        var tabs = require('sdk/tabs');

        // we attach our callback to those events.
        // Other potential candidates: 'open','load','pageshow'
        var handledEvents = [
            'ready',
            'activate'
        ];
        var eventCount = handledEvents.length; // performance paranoia.

        // now iterate over all events and attach an according listener to the tabs.
        for(var i=0;i<eventCount;i++){
            (function(event){
                tabs.on(event,function(tab){
                    var window = viewFor(tab.window);


                    // uncomment the next line to log events
                    // console.log('tab ' + event + ' ' + tab.title);

                    chromeInteractionCallback(window);
                });
                tabs.on('close',function(tab){
                    // let's see if it was the last one;
                    var windows = require('sdk/windows').browserWindows;
                    var reason = 'tab closed';
                    if(windows.length==0){
                        console.log(reason);
                        //themeSwitcher.cleanUpSSLPersonasThemes(reason);
                    }
                });
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
            var domWindow = viewFor(window);

            // uncomment the next line to log events
            // console.log('window ' + 'activate' + ' ' + window.title);

            chromeInteractionCallback(domWindow);
        });
        // we need to check if it was the last window.
        // if it was, we need to make sure, that
        // the theme is set to standard.
        windows.on('close',function(){
            var openWindows = require('sdk/windows').browserWindows;
            var reason = 'last window closed';
            if(openWindows.length == 0){
                //themeSwitcher.cleanUpSSLPersonasThemes(reason);
            }
        })


    }


    /**
     * adds an action button in the tool bar
     * that opens the about page.
     */
    function addActionButton(){
        var {ActionButton} = require('sdk/ui/button/action');
        // a reference to the tabs module / interface
        var tabs = require('sdk/tabs');

        function clickCallback(state){
            tabs.open(data.url('https://sslpersonas.tobitobi.de'));
        }

        ActionButton({
            id: 'sslpersonas-button',
            label: 'SSLPersonas',
            icon: {
                16 : data.url('img/icon/SSLPersonas-Icon-16.png'),
                32 : data.url('img/icon/SSLPersonas-Icon-32.png'),
                64 : data.url('img/icon/SSLPersonas-Icon-64.png')
            },
            onClick: clickCallback
        });
    }


    /**
     * we don't want to leave traces when the user
     * uninstalls / disables SSLPersonas.
     * Also, it's better to clean up before shutdown.
     */
    function registerUnloadCallbacks(){
        function unloadCallback(reasonString){
            var cleanupReasons = [
                'uninstall',
                'disable',
                'shutdown'
            ];
            if(cleanupReasons.indexOf(reasonString)){
                console.log('Cleaning up after SSLPersonas. Reason: '+reasonString);
                themeSwitcher.cleanUpSSLPersonasThemes('unloadCallback '+reasonString);
            }
        }

        try{
            var unload = require('sdk/system/unload');
            unload.when(unloadCallback);
        }
        catch(e){
            console.log('Unload callbacks not available.');
        }

    }




    /***
     *
     * This is where the actual magic happens.
     *
     */
    addActionButton();
    initTabListeners();
    initWindowListeners();
    registerUnloadCallbacks();



})(); // End (anonymous) namespace. Call the function.