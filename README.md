SSLPersonas
===========

A Firefox add-on that uses Firefox themes to visualize the SSL status of a website

## What it does

SSLPersonas changes Firefox's theme according to the security status of the currently opened web site.
It uses Lightweight Themes that ship with the add-on.

There are currently 5 different modes (ordered by security level starting with the most secure):

- *Extended Validation*: A <span style='color:#31cc81'>**green**</span> theme appears whenever
a site uses a valid certificate that includes additional information about the owner

- *Standard Validation*: A <span style='color:#29aae3'>**blue**</span> theme is shown whenever site use standard certificates. Secure - no more, no less.

- *Mixed Content*: Some web sites generally use SSL encrypted connections, but request some unencrypted content.
Whenever this is the case, a <span style='color:#c879f2'>**purple**</span> theme is presented to the user.

- *Unencrypted Connection*: Web sites that use the Hypertext Transfer Protocol (HTTP), trigger a
<span style='color:#f08078'>**red**</span> theme. Many sites do not have certificates. SSLPersonas informs the user
about this deficiency and maybe we can persuade web admins to set up a certficate - it's not that difficult.
- *Normal window*: Firefox's default theme is used for content that is neither loaded via HTTP nor HTTPS, e.g.
through the file:// protocol.

## Running and Packaging the Add-On

In order to generate an installable Firefox JetPack Add-On (restartless), using the Firefox Add-On SDK is recommendable. Before using the commands below, make sure to activate the plugin in your console/terminal/shell.

### Run
    $ cfx run
initializes a fresh browser instance. Only SSLPersonas is installed to test.

    $ cfx run --profiledir /path/to/some/writable/directory
lets you persist the themes etc.

### Packaging

    $ cfx xpi
generates a packaged .xpi file named `sslpersonas.xpi`


### Testing 
    $ cfx test    
performs a set of tests defined in [/test/test-main.js](/test/test-main.js)



## Credits

SSLPersonas was made by Tobi Stockinger. It would not have come into this world without:

### People

* Max-Emanuel Maurer
* Alexander De Luca
* Martin Esche

### Software

* jQuery
* Mozilla Firefox Add-On SDK