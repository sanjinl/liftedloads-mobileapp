/**
 * Integration JavaScript for PayPal's inline checkout
 *
 * @author DL-PP-WebDev-DigitalGoods
 */
if (typeof PAYPAL == 'undefined' || !PAYPAL) {
    var PAYPAL = {};
}

PAYPAL.apps = PAYPAL.apps || {};


(function () {


    var defaultConfig = {
        // DOM element which triggers the flow
        trigger: null,
        // Experience for the flow; set to 'mini' to force a popup flow
        expType: null,
        // Merchant can control the NameOnButton feature by setting boolean values
        sole: 'true',
        // To set stage environment
        stage: null,
        // To set port number of stage environment
        port: null
    };

    var BEACON_URL = 'https://www.paypal.com/webapps/hermes/api/logger';

    function beacon(event, payload) {
        try {

            payload = payload || {};
            payload.event = event;
            payload.host = window.location.host;

            var query = [];

            for (var key in payload) {
                if (payload.hasOwnProperty(key)) {
                    query.push(encodeURIComponent(key) + '=' + encodeURIComponent(payload[key]));
                }
            }

            query = query.join('&');

            var beacon = new Image();
            beacon.src = (BEACON_URL + '?' + query);

        } catch(err) {
            // pass
        }
    }



    /**
     * Creates an instance of the in-context UI for the Digital Goods flow
     *
     * @param {Object} userConfig Overrides to the default configuration
     */
    PAYPAL.apps.DGFlow = function (userConfig) {
        var that = this;

        // storage object for UI elements
        that.UI = {};

        // storage object for miniBrowser
        that.miniWin = {};

        // setup
        that._init(userConfig);

        return {
            /**
             * Public method to add a trigger outside of the constructor
             *
             * @param {HTMLElement|String} el The element to set the click event on
             */
            setTrigger: function (el) {
                that._setTrigger(el);
            },

            /**
             * Public method to start the flow without a triggering element, e.g. in a Flash movie
             *
             * @param {String} url The URL which starts the flow
             */
            startFlow: function (url) {
                var win = that._render();

                if (win.location) {
                    win.location = url;
                } else {
                    win.src = url;
                }
            },

            /**
             * Public method to close the flow's lightbox
             */
            closeFlow: function () {
                that._destroy();
            },

            /**
             * Public method to determine if the flow is active
             */
            isOpen: function () {
                if (that.dgWindow) {
                    if (that.dgWindow == 'incontext') {
                        return that.isOpen;
                    } else {
                        if (typeof that.dgWindow == 'object') {
                            return (!that.dgWindow.closed);
                        } else {
                            return false;
                        }
                    }
                } else {
                    return that.isOpen;
                }
            }
        };
    };


    PAYPAL.apps.DGFlow.prototype = {

        /**
         * Name of the iframe that's created
         */
        name: 'PPDGFrame',


        /**
         * Boolean; true if the flow is active
         */
        isOpen: false,


        /**
         * Boolean; true if NameOnButton feature is active
         */
        NoB: true,

        /**
         * internal object that stores the window object
         */
        dgWindow: 'incontext',

        /** Boolean: indicates whether RMC was set or not */
        RMC: false,


        /**
         * Initial setup
         *
         * @param {Object} userConfig Overrides to the default configuration: see defaultConfig.
         */
        _init: function (userConfig) {

            beacon('dg_flow_init');

            if (userConfig) {
                for (var key in defaultConfig) {
                    if (typeof userConfig[key] !== 'undefined') {
                        this[key] = userConfig[key];
                    } else {
                        this[key] = defaultConfig[key];
                    }
                }
            }
            this.port = (this.port == null) ? "" : ":" + this.port;
            this.stage = (this.stage == null) ? "www.paypal.com" : "www." + this.stage + ".paypal.com" + this.port;
            if (this.trigger) {
                this._setTrigger(this.trigger);
            }
            this._addCSS();

            // NoB is started
            if (this.NoB == true && this.sole == 'true') {
                var url = "https://" + this.stage + "/webapps/checkout/nameOnButton.gif";
                this._getImage(url, this._addImage);
            }
        },

        _launchMiniWin: function () {
            if (this.miniWin.state != undefined) {
                if (!this.miniWin.twin.closed) {
                    this.miniWin.twin.focus();
                    return this.miniWin;
                } else {
                    this.miniWin = {};
                    return this._openMiniBrowser();
                }
            } else {
                return this._openMiniBrowser();
            }
        },

        _launchMask: function () {
            this._createMask();
            this._centerLightbox();
            this._bindEvents();
        },

        /**
         * Renders and displays the UI
         *
         * @return {HTMLElement} The window the flow will appear in
         */
        _render: function () {
            var ua = navigator.userAgent,
                win;

            beacon('dg_flow_launch');

            // mobile exerience
            if (ua.match(/iPhone|iPod|iPad|Android|Blackberry.*WebKit/i)) {
                win = window.open('', this.name);
                this.dgWindow = win;
                return win;
            } else {
                switch (this.expType) {
                case "mini":
                    this._buildDOMMB();
                    this._launchMask();
                case "popup":
                    return this._launchMiniWin();
                    break;
                case "instant":
                    if (!this.RMC) {
                        this._buildDOMMB();
                        this._launchMask();
                        return this._launchMiniWin();
                        break;
                    }
                default:
                    this._buildDOM();
                    this._launchMask();
                    this.isOpen = true;
                    return this.UI.iframe;
                }
            }
        },

                /**
                 * Opens the mini-browser window
                 *
                 * @return {Object} The mini-browser window object
                 */

        _openMiniBrowser: function () {
            var width = 420,
                height = 560,
                left, top, win;
            var winOpened = false;
            if (window.outerWidth) {
                left = Math.round((window.outerWidth - width) / 2) + window.screenX;
                top = Math.round((window.outerHeight - height) / 2) + window.screenY;
            } else if (window.screen.width) {
                left = Math.round((window.screen.width - width) / 2);
                top = Math.round((window.screen.height - height) / 2);
            }
            win = window.open('about:blank', this.name, 'top=' + top + ', left=' + left + ', width=' + width + ', height=' + height + ', location=1, status=1, toolbar=0, menubar=0, resizable=0, scrollbars=1');
            try {
	        win.document.write("<style>#myDiv{position:absolute; left:36%; top:27%; font-style:italic; font-weight:bold; font-family:arial,Helvetica,sans-serif; font-size:75%; color:#084482; }</style><body><div id=\"myDiv\">LOADING <span id=\"mySpan\"> </span></div></body><script>var sspan = document.getElementById('mySpan');var int = setInterval(function() { if ((sspan.innerHTML += '.').length == 4)  sspan.innerHTML = '';}  , 200);</script>");
		} catch (err) {}    
	    this.miniWin.state = false;
            this.dgWindow = win;
            winOpened = true;
            if (this.expType == "instant" || this.expType == "mini") {
                var dgObj = this;
                if (winOpened) {
                    intVal = setInterval(function () {
                        if (win && win.closed) {
                            clearInterval(intVal);
                            winOpened = false;
                            return dgObj._destroy();
                        }
                    }, 1000);
                }
                addEvent(this.UI.goBtn, 'click', this._launchMiniWin, this);
                addEvent(this.UI.closer, 'click', this._destroy, this);
            }
            this.miniWin.twin = win;

            return win;
        },


                /**
                 * Embeds the CSS for the UI into the document head
                 */
        _addCSS: function () {
            var css = '',
                styleEl = document.createElement('style');

            // write the styles into the page
            css += '#' + this.name + ' { z-index:20002; position:absolute; top:0; left:0; }';
            css += '#' + this.name + ' .panel { z-index:20003; position:relative; }';
            css += '#' + this.name + ' .panel iframe { width:385px; height:550px; border:0; }';
            css += '#' + this.name + ' .mask { z-index:20001; position:absolute; top:0; left:0; background-color:#000; opacity:0.2; filter:alpha(opacity=20); }';
            css += '.nameOnButton { display: inline-block; text-align: center; }';
            css += '.nameOnButton img { border:none; }';
            if ((this.expType == "instant" && !this.RMC) || this.expType == "mini") {
                css += '#' + this.name + ' .panel { font:12px Arial,Helvetica,sans-serif;}';
                css += '#' + this.name + ' .panel .outer { position:relative; border:0;background: url("https://www.paypalobjects.com/en_US/i/scr/scr_dg_sliding_door_bdr_wf.png") no-repeat scroll left top transparent; }';
                css += '#' + this.name + ' .panel .page #goBtn { border:1px solid #d5bd98; border-right-color:#935e0d; border-bottom-color:#935e0d; background:#ffa822 url("https://www.paypalobjects.com/en_US/i/pui/core/btn_bg_sprite.gif") left 17.5% repeat-x; cursor:pointer; font:12px Arial,Helvetica,sans-serif; margin-top:10px;}';
                css += '#' + this.name + ' .panel .page #goBtn span {margin:5px;}';
                css += '#' + this.name + ' .panel .outer .page { background: url("https://www.paypalobjects.com/en_US/i/scr/scr_dg_sliding_door_bdr_wf.png") no-repeat scroll right top transparent; margin-left:  15px; padding: 10px 10px 0 0; position:relative; min-height: 290px; left:17px; }';
                css += '#' + this.name + ' .panel .outer .page .launcher { padding:0 0 20px 0; width:315px!important; }';
                css += '#' + this.name + ' .panel .outer .page .launcher .logoPara { text-align:right;}';
                css += '#' + this.name + ' .panel .outer .page .launcher .continueText { padding-right:10px;}';
                css += '#' + this.name + ' .panel .minifooter {background: url("https://www.paypalobjects.com/en_US/i/scr/scr_dg_sliding_door_bdr_wf.png") no-repeat scroll right bottom transparent; position: absolute;  width:80%; height:12px; right:0px}';
                css += '#' + this.name + ' .panel .outer .minifootercap {background: url("https://www.paypalobjects.com/en_US/i/scr/scr_dg_sliding_door_bdr_wf.png") no-repeat scroll left bottom transparent; left: -32px; position: absolute; height: 12px; width:80%;}';
                css += '#' + this.name + ' .panel #closer{ top:-10px; right:0; position:absolute;}';
                css += '#' + this.name + ' .panel #closer a{margin:0; padding:0; list-style:none;  text-decoration:none; position:absolute; height:26px; display:block; width:26px; background:url("https://www.paypal.com/en_US/i/btn/btn_dg_close_sprite.png");cursor:pointer;}';
                css += '#' + this.name + ' .panel #closer a:hover{background: url("https://www.paypal.com/en_US/i/btn/btn_dg_close_sprite.png") -26px 0;}';
            }
            styleEl.type = 'text/css';
            styleEl.id = 'dgCSS';
            if (styleEl.styleSheet) {
                styleEl.styleSheet.cssText = css;
            } else {
                styleEl.appendChild(document.createTextNode(css));
            }
            document.getElementsByTagName('head')[0].appendChild(styleEl);
        },


        /**
         * Creates the DOM nodes and adds them to the document body
         */
        _buildDOM: function () {
            this.UI.wrapper = document.createElement('div');
            this.UI.wrapper.id = this.name;
            this.UI.panel = document.createElement('div');
            this.UI.panel.className = 'panel';

            // workaround: IE6 + 7 won't let you name an iframe after you create it
            try {
                this.UI.iframe = document.createElement('<iframe name="' + this.name + '">');
            } catch (e) {
                this.UI.iframe = document.createElement('iframe');
                this.UI.iframe.name = this.name;
            }
            this.UI.iframe.frameBorder = '0';
            this.UI.iframe.border = '0';
            this.UI.iframe.scrolling = 'no';
            this.UI.iframe.allowTransparency = 'true';
            this.UI.mask = document.createElement('div');
            this.UI.mask.className = 'mask';
            this.UI.panel.appendChild(this.UI.iframe);
            this.UI.wrapper.appendChild(this.UI.mask);
            this.UI.wrapper.appendChild(this.UI.panel);
            document.body.appendChild(this.UI.wrapper);
        },
        _buildDOMMB: function () {
            this.UI.wrapper = document.createElement('div');
            this.UI.wrapper.id = this.name;
            this.UI.panel = document.createElement('div');
            this.UI.panel.className = 'panel';
            this.UI.mask = document.createElement('div');
            this.UI.mask.className = 'mask';
            this.UI.outer = document.createElement('div');
            this.UI.outer.className = 'outer';
            this.UI.page = document.createElement('div');
            this.UI.page.className = 'page';
            this.UI.closer = document.createElement('div');
            this.UI.closer.id = 'closer';
            this.UI.closerImg = document.createElement('a');
            this.UI.closerImg.src = '#';
            this.UI.launcher = document.createElement('div');
            this.UI.launcher.className = 'launcher';
            this.UI.loadingPara = document.createElement('p');
            this.UI.loadingPara.className = 'continueText';
            this.UI.loadingText = document.createTextNode("Please continue your purchase in the secure window we opened. If you don't see it, click the button below.");
            this.UI.goBtn = document.createElement('button');
            this.UI.goBtn.id = 'goBtn';
            this.UI.goBtn.value = 'Go';
            this.UI.goBtn.innerHTML = '<span>Go</span>';
            this.UI.goBtn.className = 'button primary';
            this.UI.logoPara = document.createElement('p');
            this.UI.logoPara.className = 'logoPara';
            this.UI.logoImg = document.createElement('img');
            this.UI.logoImg.alt = 'logo';
            this.UI.logoImg.src = 'https://www.paypal.com/en_US/i/logo/logo_paypal_140wx50h.gif';
            this.UI.logoImg.className = 'logo';
            this.UI.minifooter = document.createElement('div');
            this.UI.minifooter.className = 'minifooter';
            this.UI.minifooter.id = 'minifooter';
            this.UI.minifootercap = document.createElement('div');
            this.UI.minifootercap.className = 'minifootercap';
            this.UI.minifootercap.id = 'minifootercap';
            this.UI.wrapper.appendChild(this.UI.mask);
            this.UI.wrapper.appendChild(this.UI.panel);
            document.body.appendChild(this.UI.wrapper);
            this.UI.panel.appendChild(this.UI.outer);
            this.UI.outer.appendChild(this.UI.page);
            this.UI.page.appendChild(this.UI.launcher);
            this.UI.outer.appendChild(this.UI.closer);
            this.UI.closer.appendChild(this.UI.closerImg);
            this.UI.launcher.appendChild(this.UI.logoPara);
            this.UI.logoPara.appendChild(this.UI.logoImg);
            this.UI.loadingPara.appendChild(this.UI.loadingText);
            this.UI.launcher.appendChild(this.UI.loadingPara);
            this.UI.launcher.appendChild(this.UI.goBtn);
            this.UI.page.appendChild(this.UI.minifooter);
            this.UI.page.appendChild(this.UI.minifootercap);
        },



        /**
         * Creates the mask
         */
        _createMask: function (e) {
            var windowWidth, windowHeight, scrollWidth, scrollHeight, width, height;

            var actualWidth = (document.documentElement) ? document.documentElement.clientWidth : window.innerWidth;

            // get the scroll dimensions
            if (window.innerHeight && window.scrollMaxY) {
                scrollWidth = actualWidth + window.scrollMaxX;
                scrollHeight = window.innerHeight + window.scrollMaxY;
            } else if (document.body.scrollHeight > document.body.offsetHeight) {
                scrollWidth = document.body.scrollWidth;
                scrollHeight = document.body.scrollHeight;
            } else {
                scrollWidth = document.body.offsetWidth;
                scrollHeight = document.body.offsetHeight;
            }

            // get the window dimensions
            // non-IE browsers
            if (window.innerHeight) {
                windowWidth = actualWidth;
                windowHeight = window.innerHeight;

                // IE 6+ in standards mode
            } else if (document.documentElement && document.documentElement.clientHeight) {
                windowWidth = document.documentElement.clientWidth;
                windowHeight = document.documentElement.clientHeight;

                // other IEs
            } else if (document.body) {
                windowWidth = document.body.clientWidth;
                windowHeight = document.body.clientHeight;
            }

            // take the larger of each
            width = (windowWidth > scrollWidth) ? windowWidth : scrollWidth;
            height = (windowHeight > scrollHeight) ? windowHeight : scrollHeight;
            this.UI.mask.style.width = width + 'px';
            this.UI.mask.style.height = height + 'px';
        },


        /**
         * Centers the lightbox in the middle of the window
         */
        _centerLightbox: function (e) {
            var width, height, scrollY;

            // non-IE browsers
            if (window.innerWidth) {
                width = window.innerWidth;
                height = window.innerHeight;
                scrollY = window.pageYOffset;
                // IE 6+ in standards mode
            } else if (document.documentElement && (document.documentElement.clientWidth || document.documentElement.clientHeight)) {
                width = document.documentElement.clientWidth;
                height = document.documentElement.clientHeight;
                scrollY = document.documentElement.scrollTop;
                // other browsers
            } else if (document.body && (document.body.clientWidth || document.body.clientHeight)) {
                width = document.body.clientWidth;
                height = document.body.clientHeight;
                scrollY = document.body.scrollTop;
            }

            if ((this.expType == "instant" && !this.RMC) || this.expType == "mini") {
                var panelWidth = 355,
                    panelHeight = 300;
                this.UI.launcher.style.width = panelWidth + "px";
                this.UI.launcher.style.height = panelHeight + "px";
                this.UI.panel.style.left = Math.round((width - panelWidth) / 2) + 'px';
                var panelTop = Math.round((height - 550) / 2) + scrollY + 20;
            } else {
                this.UI.panel.style.left = Math.round((width - this.UI.iframe.offsetWidth) / 2) + 'px';
                var panelTop = Math.round((height - this.UI.iframe.offsetHeight) / 2) + scrollY;
            }
            if (panelTop < 5) {
                panelTop = 10;
            }
            this.UI.panel.style.top = panelTop + 'px';
        },


        /**
         * Sets up the events for an instance
         */
        _bindEvents: function () {
            addEvent(window, 'resize', this._createMask, this);
            addEvent(window, 'resize', this._centerLightbox, this);
            addEvent(window, 'unload', this._destroy, this);
        },


        /**
         * Adds a click event to an element which initiates the flow
         *
         * @param {HTMLElement[]|String[]} el The element to attach the click event to
         * @return {Boolean} True if the trigger is active and false if it failed
         */
        _setTrigger: function (el) {
            // process an array if passed
            if (el.constructor.toString().indexOf('Array') > -1) {
                for (var i = 0; i < el.length; i++) {
                    this._setTrigger(el[i]);
                }

                // otherwise process a single element
            } else {
                el = (typeof el == 'string') ? document.getElementById(el) : el;

                // forms
                if (el && el.form) {
                    el.form.target = this.name;
                    // links
                } else if (el && el.tagName.toLowerCase() == 'a') {
                    el.target = this.name;
                }
                addEvent(el, 'click', this._triggerClickEvent, this);
            }
        },


        /**
         * To load the NameOnButton image
         *
         * @param {Element} el The trigger is passed
         */

        _getImage: function (url, callback) {


            // Can be used for addEvent case
            if (typeof this.callback != 'undefined') {
                url = this.url;
                callback = this.callback;
            }
            var self = this;
            var imgElement = new Image();
            imgElement.src = "";
            if (imgElement.readyState) {
                imgElement.onreadystatechange = function () {
                    if (imgElement.readyState == 'complete' || imgElement.readyState == 'loaded') {
                        callback(imgElement, self);
                    }
                };
            } else {
                imgElement.onload = function () {
                    callback(imgElement, self);
                };
            }
            imgElement.src = url;
        },

        /**
         * Place NameOnButton image in on top of the Checkout button
         *
         * @param {Image} img NameOnButton image is passed
         * @param {Object} obj Contains config parameters and functions
         * @param {Element} el The trigger element
         */

        _addImage: function (img, obj) {
            if (checkEmptyImage(img)) {

                obj.RMC = true;
                var url = "https://" + obj.stage + "/webapps/checkout/clearNob.gif";
                var wrapperObj = {};
                wrapperObj.callback = obj._removeImage;
                wrapperObj.url = url;
                wrapperObj.outer = obj;
                var el = obj.trigger;
                if (el != null) {
                    if (el.constructor.toString().indexOf('Array') > -1) {
                        for (var i = 0; i < el.length; i++) {
                            var tempImg = img.cloneNode(true);
                            obj._placeImage(el[i], tempImg, wrapperObj);
                        }
                    } else {
                        obj._placeImage(el, img, wrapperObj);
                    }
                }
            }
        },

        /**
         * Place NameOnButton image in on top of the Checkout button
         *
         * @param {Element} el The trigger element
         * @param {Image} img NameOnButton image is passed
         * @param {Object} obj Contains config parameters and logout link
         */

        _placeImage: function (el, img, obj) {
            el = (typeof el == 'string') ? document.getElementById(el) : el;
            var root = getParent(el);
            var spanElement = document.createElement("span");
            spanElement.className = "nameOnButton";
            var lineBreak = document.createElement("br");
            var link = document.createElement("a");
            link.href = "javascript:";
            link.appendChild(img);
            root.insertBefore(spanElement, el);
            spanElement.appendChild(el);
            spanElement.insertBefore(link, el);
            spanElement.insertBefore(lineBreak, el);
            obj.span = spanElement;
            obj.link = link;
            obj.lbreak = lineBreak;
            addEvent(link, 'click', obj.outer._getImage, obj);
        },

        /**
         * Place NameOnButton image in on top of the Checkout button
         *
         * @param {Image} img NameOnButton image is passed
         * @param {Object} obj Contains config parameters and logout link
         * @param {Element} el The trigger element
         */
        _removeImage: function (img, obj) {
            if (!checkEmptyImage(img)) {
                var el = obj.outer.trigger;
                if (el.constructor.toString().indexOf('Array') > -1) {
                    obj.outer._removeMultiImages(obj.outer.trigger);
                } else {
                    spanElement = obj.span;
                    link = obj.link;
                    lineBreak = obj.lbreak;
                    spanElement.removeChild(link);
                    spanElement.removeChild(lineBreak);
                }
            }
        },


        /**
         * Place NameOnButton image in on top of the Checkout button
         *
         * @param {Image} img NameOnButton image is passed
         */

        _removeMultiImages: function (obj) {
            for (var i = 0; i < obj.length; i++) {
                obj[i] = (typeof obj[i] == 'string') ? document.getElementById(obj[i]) : obj[i];
                rootNode = getParent(obj[i]);
                if (rootNode.className == 'nameOnButton') {
                    lineBreak = getPreviousSibling(obj[i]);
                    linkNode = getPreviousSibling(lineBreak);
                    rootNode.removeChild(linkNode);
                    rootNode.removeChild(lineBreak);
                }
            }
        },

        /**
         * Custom event which fires on click of the trigger element(s)
         *
         * @param {Event} e The event object
         */
        _triggerClickEvent: function (e) {
            this._render();
        },


        /**
         * Custom event which does some cleanup: all UI DOM nodes, custom events,
         * and intervals are removed from the current page
         *
         * @param {Event} e The event object
         */
        _destroy: function (e) {
            if (typeof this.dgWindow == 'object') {
                try {
                    this.dgWindow.close();
                } catch (er) {}
            }
            if (document.getElementById('PPDGFrame')) {
                var parentDiv = document.getElementById('PPDGFrame').parentNode;
                parentDiv.removeChild(document.getElementById('PPDGFrame'));
            }
            if (this.isOpen && this.UI.wrapper.parentNode) {
                this.UI.wrapper.parentNode.removeChild(this.UI.wrapper);
            }
            if (this.interval) {
                clearInterval(this.interval);
            }
            removeEvent(window, 'resize', this._createMask);
            removeEvent(window, 'resize', this._centerLightbox);
            removeEvent(window, 'unload', this._destroy);
            removeEvent(window, 'message', this._windowMessageEvent);
            this.isOpen = false;
        }
    };



    /* Helper Methods */


    /**
     * Storage object for all events; used to obtain exact signature when
     * removing events
     */
    var eventCache = [];

    /**
     * Normalized method of adding an event to an element
     *
     * @param {HTMLElement} obj The object to attach the event to
     * @param {String} type The type of event minus the "on"
     * @param {Function} fn The callback function to add
     * @param {Object} scope A custom scope to use in the callback (optional)
     */

    function addEvent(obj, type, fn, scope) {
        scope = scope || obj;
        var wrappedFn;
        if (obj) {
            if (obj.addEventListener) {
                wrappedFn = function (e) {
                    fn.call(scope, e);
                };
                obj.addEventListener(type, wrappedFn, false);
            } else if (obj.attachEvent) {
                wrappedFn = function () {
                    var e = window.event;
                    e.target = e.target || e.srcElement;
                    e.preventDefault = function () {
                        window.event.returnValue = false;
                    };
                    fn.call(scope, e);
                };
                obj.attachEvent('on' + type, wrappedFn);
            }
        }
        eventCache.push([obj, type, fn, wrappedFn]);
    }


    /**
     * Normalized method of removing an event from an element
     *
     * @param {HTMLElement} obj The object to attach the event to
     * @param {String} type The type of event minus the "on"
     * @param {Function} fn The callback function to remove
     */

    function removeEvent(obj, type, fn) {
        var wrappedFn, item, len, i;

        for (i = 0; i < eventCache.length; i++) {
            item = eventCache[i];
            if (item[0] == obj && item[1] == type && item[2] == fn) {
                wrappedFn = item[3];
                if (wrappedFn) {
                    if (obj.removeEventListener) {
                        obj.removeEventListener(type, wrappedFn, false);
                    } else if (obj.detachEvent) {
                        obj.detachEvent('on' + type, wrappedFn);
                    }
                }
            }
        }
    }

    /**
     * Normalized method of getting the corresponding parent element for an element
     *
     * @param {HTMLElement} obj The object to get the corresponding parent element
     */

    function getParent(el) {
        do {
            el = el.parentNode;
        }
        while (el && el.nodeType != 1);
        return el;
    }

    /**
     * Normalized method of getting the corresponding previous sibling element for an element
     *
     * @param {HTMLElement} obj The object to get the corresponding previous sibling element
     */

    function getPreviousSibling(el) {
        do {
            el = el.previousSibling;
        }
        while (el && el.nodeType != 1);
        return el;
    }

    /**
     * Normalized method of checking empty image
     *
     * @param {HTMLElement} obj The object should be an image object
     */

    function checkEmptyImage(img) {
        return (img.width > 1 || img.height > 1);
    }
}());


