/*!
 * jQuery UI Widget @VERSION
 *
 * Copyright (c) 2009 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Widget
 */
(function($) {

var _remove = $.fn.remove;

$.fn.remove = function() {
	// Safari has a native remove event which actually removes DOM elements,
	// so we have to use triggerHandler instead of trigger (#3037).
	$("*", this).add(this).each(function() {
		$(this).triggerHandler("remove");
	});
	return _remove.apply(this, arguments);
};

$.widget = function(name, base, prototype) {
	var namespace = name.split(".")[0],
		fullName;
	name = name.split(".")[1];
	fullName = namespace + '-' + name;

	if (!prototype) {
		prototype = base;
		base = $.Widget;
	}

	// create selector for plugin
	$.expr[':'][fullName] = function(elem) {
		return !!$.data(elem, name);
	};

	$[namespace] = $[namespace] || {};
	$[namespace][name] = function(options, element) {
		// allow instantiation without initializing for simple inheritance
		(arguments.length && this._widgetInit(options, element));
	};

	var basePrototype = new base();
	// we need to make the options hash a property directly on the new instance
	// otherwise we'll modify the options hash on the prototype that we're
	// inheriting from
//	$.each(basePrototype, function(key, val) {
//		if ($.isPlainObject(val)) {
//			basePrototype[key] = $.extend({}, val);
//		}
//	});
	basePrototype.options = $.extend({}, basePrototype.options);
	$[namespace][name].prototype = $.extend(true, basePrototype, {
		namespace: namespace,
		widgetName: name,
		widgetEventPrefix: $[namespace][name].prototype.widgetEventPrefix || name,
		widgetBaseClass: fullName
	}, prototype);

	$.widget.bridge(name, $[namespace][name]);
};

$.widget.bridge = function(name, object) {
	$.fn[name] = function(options) {
		var isMethodCall = (typeof options == 'string'),
			args = Array.prototype.slice.call(arguments, 1),
			returnValue = this;
			
		// allow multiple hashes to be passed on init
		options = !isMethodCall && args.length
			? $.extend.apply(null, [true, options].concat(args))
			: options;

		// prevent calls to internal methods
		if (isMethodCall && options.substring(0, 1) == '_') {
			return returnValue;
		}

		(isMethodCall
			? this.each(function() {
				var instance = $.data(this, name),
					methodValue = (instance && $.isFunction(instance[options])
						? instance[options].apply(instance, args)
						: instance);
				if (methodValue !== instance && methodValue !== undefined) {
					returnValue = methodValue;
					return false;
				}
			})
			: this.each(function() {
				($.data(this, name) || $.data(this, name, new object(options, this)));
			}));

		return returnValue;
	};
};

$.Widget = function(options, element) {
	// allow instantiation without initializing for simple inheritance
	(arguments.length && this._widgetInit(options, element));
};

$.Widget.prototype = {
	widgetName: 'widget',
	widgetEventPrefix: '',
	options: {
		disabled: false
	},
	_widgetInit: function(options, element) {
		// $.widget.bridge stores the plugin instance, but we do it anyway
		// so that it's stored even before the _init function runs
		this.element = $(element).data(this.widgetName, this);
		this.options = $.extend(true, {},
			this.options,
			// DEPRECATED: move defaults to prototype.options
			$[this.namespace][this.widgetName].defaults,
			$.metadata && $.metadata.get(element)[this.widgetName],
			options);

		// TODO: use bind's scope option when moving to jQuery 1.4
		var self = this;
		this.element.bind('remove.' + this.widgetName, function() {
			self.destroy();
		});

		(this._init && this._init(options, element));
	},

	destroy: function() {
		this.element
			.unbind('.' + this.widgetName)
			.removeData(this.widgetName);
		this.widget()
			.unbind('.' + this.widgetName)
			.removeAttr('aria-disabled')
			.removeClass(
				this.widgetBaseClass + '-disabled ' +
				this.namespace + '-state-disabled');
	},

	widget: function() {
		return this.element;
	},

	option: function(key, value) {
		var options = key,
			self = this;

		if (arguments.length === 0) {
			// don't return a reference to the internal hash
			return $.extend({}, self.options);
		}

		if (typeof key == "string") {
			if (value === undefined) {
				return this.options[key];
			}
			options = {};
			options[key] = value;
		}

		$.each(options, function(key, value) {
			self._setOption(key, value);
		});

		return self;
	},
	_setOption: function(key, value) {
		this.options[key] = value;

		if (key == 'disabled') {
			this.widget()
				[value ? 'addClass' : 'removeClass'](
					this.widgetBaseClass + '-disabled' + ' ' +
					this.namespace + '-state-disabled')
				.attr("aria-disabled", value);
		}

		return this;
	},

	enable: function() {
		return this._setOption('disabled', false);
	},
	disable: function() {
		return this._setOption('disabled', true);
	},

	_trigger: function(type, event, data) {
		var callback = this.options[type];

		event = $.Event(event);
		event.type = (type == this.widgetEventPrefix
				? type : this.widgetEventPrefix + type).toLowerCase();
		data = data || {};

		// copy original event properties over to the new event
		// this would happen if we could call $.event.fix instead of $.Event
		// but we don't have a way to force an event to be fixed multiple times
		if (event.originalEvent) {
			for (var i = $.event.props.length, prop; i;) {
				prop = $.event.props[--i];
				event[prop] = event.originalEvent[prop];
			}
		}

		this.element.trigger(event, data);

		return !($.isFunction(callback) && callback.call(this.element[0], event, data) === false
			|| event.isDefaultPrevented());
	}
};

// DEPRECATED: use the plugin's parent widget instead of $.widget
$.widget.prototype = $.Widget.prototype;
	
})(jQuery);
