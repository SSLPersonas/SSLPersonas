/**
 * Created by Tobi Stockinger on 17/02/15.
 * This module is based on https://developer.mozilla.org/en-US/Add-ons/Code_snippets/Preferences
 * Changes:
 *  - We're not using prototypes.
 *  - We utilize require to unwrap the Cc and Ci modules.
 */
/**
 * @constructor
 *
 * @param {string} branch_name
 * @param {Function} callback must have the following arguments:
 *   branch, pref_leaf_name
 */
function PrefListener(branch_name, callback) {

    var {Cc, Ci} = require('chrome');

    // Keeping a reference to the observed preference branch or it will get
    // garbage collected.
    var prefService = Cc["@mozilla.org/preferences-service;1"]
        .getService(Ci.nsIPrefService);
    var self = this;
    this.branch = prefService.getBranch(branch_name);
    this.branch.QueryInterface(Ci.nsIPrefBranch2);
    this.callback = callback;

    this.observe = function(subject, topic, data) {
        if (topic == 'nsPref:changed'){
            self.callback(self.branch, data);
        }
    };

    /**
     * @param {boolean=} trigger if true triggers the registered function
     *   on registration, that is, when this method is called.
     */
    this.register = function(trigger) {
        self.branch.addObserver('', self, false);
        if (trigger) {
            var that = self;
            self.branch.getChildList('', {}).
                forEach(function (pref_leaf_name)
                { that.callback(that.branch, pref_leaf_name); });
        }
    };


    this.unregister = function() {
        if (self.branch)
            self.branch.removeObserver('', self);
    };

}

exports.PrefListener = PrefListener;