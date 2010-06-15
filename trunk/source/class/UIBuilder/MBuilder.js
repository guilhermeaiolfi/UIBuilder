qx.Mixin.define("UIBuilder.MBuilder",
{
    members :
    {
        __widgetRegistry : null,
        __bindQueue : null,
        __forms : null,


        /**
         * TODOC
         *
         * @param definition {var} TODOC
         * @return {var} TODOC
         */
        build : function(definition)
        {

            var bind_queue = this.__bindQueue;

            if (!bind_queue) {
                this.__bindQueue = {};
            }

            if (!this.__forms) {
                this.__forms = [];
            }

            return this.__create(definition);
        },


        /**
         * TODOC
         *
         * @param id {var} TODOC
         * @param obj {Object} TODOC
         * @return {void} 
         */
        _registerObject : function(id, obj)
        {
        	var db = this.__widgetRegistry;

            if (!db) {
                this.__widgetRegistry = {};
            }
            if (id) {
                this.__widgetRegistry[id] = obj;
            }
        },


        /**
         * TODOC
         *
         * @param definition {var} TODOC
         * @return {var} TODOC
         */
        __create : function(definition)
        {
            if (qx.core.Variant.isSet("qx.debug", "on")) {
                this.__validateEntry(definition);
            }

            var widget = null;
            if (definition.create && definition.create['getInstance'])
            {
            	widget = definition.create.getInstance();
            }
            else if (definition.create)
            {
            	widget = new definition.create();
            }
            else
            {
            	widget = definition.use;
            }

            this._set(widget, definition.set);

            if (qx.Class.hasInterface(widget.constructor, UIBuilder.ui.form.IForm))
            {
                //          if (!definition.id)
                //          {
                //            this.error("The form's ID is mandatory");
                //          }
                var form = { form : widget };

                if (definition.validator) {
                    widget.getValidationManager().setValidator(definition.validator);
                }

                var controller = null;

                if (definition.model) 
                {
                	if (definition.model.controller)
                	{
	                    controller = this.__create(definition.model.controller);
	                    controller.setTarget(widget);
                	}
                	else
                    {
                        controller = new UIBuilder.data.controller.Form(null, widget);
                    }
                	
                	if (definition.model.store)
                	{
                		 var storeEntry = definition.model.store;
                         var store = null;
                         	
                         if (qx.lang.Type.isString(storeEntry))
                         {
                         	store = this.getById(storeEntry);
                         }
                         else if (storeEntry.use != undefined)
                         {
                         	store = storeEntry.use;
                         }
                         else if (storeEntry.create != undefined)
                         {
                         	store = this.build(storeEntry);
                         }
                         else
                         {
                         	this.error("No store defined.");
                         	return;
                         }
                         store.addListenerOnce("loaded", function() {
                        	 store.bind("model" + (definition.model.controller.items && !qx.lang.String.startsWith(definition.model.controller.items, "[") ? "." + definition.model.controller.items : definition.model.controller.items ? definition.model.controller.items : ""), controller, "model");
                        	 
                         }, this);
                	}
                }
                

                form.controller = controller;
                this.__forms.push(form);
            }

            this._registerObject(definition.id, widget);

            this.__flushBindingQueue(widget, definition);

            this.__configureLayout(widget, definition);

            this.__runAddMethods(widget, definition);

            this.__addListeners(widget, definition);

            if (definition.bind)
            {
            	this.__addBindings(widget, definition);
            }

            if (definition.init) {
                definition.init.call(this, widget);
            }

            if (this._getLastForm('form') == widget)
            {
                this._getLastForm('controller').createModel();
                qx.lang.Array.remove(this.__forms, this._getLastForm());
            }

            return widget;
        },


        /**
         * TODOC
         *
         * @param widget {var} TODOC
         * @param definition {var} TODOC
         * @return {void} 
         */
        __flushBindingQueue : function(target, definition)
        {
            if (this.__bindQueue[definition.id])
            {
                for (var i=0; i<this.__bindQueue[definition.id].bind.length; i++)
                {
                    var bind = this.__bindQueue[definition.id].bind[i];
                    if (qx.Class.hasInterface(target.constructor, UIBuilder.ui.form.IForm) && bind.type == "field") {
                        this._getFormController(target).addBindingOptions(bind.targetProperty, target, bind.property, bind.bidirectional, bind.toModel, bind.toSerialize);
                    } else {
                        bind['from'].bind(bind.fromProperty, target, bind.targetProperty, bind.options);
                    }
                }

                delete this.__bindQueue[definition.id];
            }
        },


        /**
         * TODOC
         *
         * @param widget {var} TODOC
         * @param entry {var} TODOC
         * @return {void} 
         */
        __runAddMethods : function(widget, entry)
        {
            if (entry['add'])  // include the children first
            {
                if (entry.lazy)
                {
                    widget.addListenerOnce("appear", function(e) {
                        this.__buildChildren(widget, entry['add'], 'add', true);
                    }, this);
                }
                else
                {
                    this.__buildChildren(widget, entry['add'], 'add', true);
                }
            }

            for (var add in entry)
            {
                if (qx.lang.String.startsWith(add, 'add')) 
                {
                    if (add == 'add') { // was already used
                        continue;
                    }

                    var include = widget[add] != null;

                    if (!include) {
                        this.warn("Missing method " + add + " in " + widget);
                    }

                    if (entry.lazy)
                    {
                        widget.addListenerOnce("appear", function(e) {
                            this.__buildChildren(widget, entry[add], add, include);
                        }, this);
                    }
                    else
                    {
                        this.__buildChildren(widget, entry[add], add, include);
                    }
                }
            }
        },


        /**
         * TODOC
         *
         * @param widget {var} TODOC
         * @param children {var} TODOC
         * @param method {var} TODOC
         * @param include {var} TODOC
         * @return {void} 
         */
        __buildChildren : function(widget, children, method, include)
        {
            for (var i=0; i<children.length; i++)
            {
                var entry = children[i];

                var obj = null;

                if (entry.create)
                {
            		obj = this.__create(entry);

                    if (include)
                    {
                        widget[method](obj);

                        if (entry.position) {
                            obj.setLayoutProperties(entry.position);
                        }
                    }
	                var clazz = obj.constructor;
	
	                if (qx.Class.hasInterface(clazz, qx.ui.form.IForm) && clazz != qx.ui.form.RadioButton)
	                {
	                	var form = this._getLastForm('form');
	                	
	                	if (form)
	                	{
	                		if (entry.id == undefined)
	                		{
	                			this.error("Form Field IDs is mandatory");
	                			continue;
	                		}
	                		form.addItem(entry.id, obj, entry);
	                	}
	                	this.__configureModel(obj, entry);
	                }
                }
                else if (widget[method])
                {
                    widget[method].apply(widget, [entry]);
                }
            }
        },


        /**
         * TODOC
         *
         * @param att {var} TODOC
         * @return {var} TODOC
         */
        _getLastForm : function(att)
        {
            var form = this.__forms[this.__forms.length - 1];

            if (form && att) {
                return form[att];
            }

            return form;
        },


        /**
         * TODOC
         *
         * @param widget {var} TODOC
         * @return {var | null} TODOC
         */
        _getFormController : function(widget)
        {
            for (var i=0, len=this.__forms.length; i<len; i++)
            {
                if (this.__forms[i].form == widget) {
                    return this.__forms[i].controller;
                }
            }

            return null;
        },


        /**
         * TODOC
         *
         * @param obj {Object} TODOC
         * @param entry {var} TODOC
         * @return {void} 
         */
        __configureModel : function(obj, entry)
        {
            var clazz = obj.constructor;
            var form = this._getLastForm('form');

            var targetProperty = "value";
            var target = obj, controller = null;
            var bidirectional = true;
            if (entry.model && entry.model.store)
            {
                var storeEntry = entry.model.store;
                var store = null;
                if (qx.lang.Type.isString(storeEntry))
                {
                	store = this.getById(storeEntry);
                }
                else if (storeEntry.create != undefined)
                {
                	store = this.build(storeEntry);
                }
                else if (storeEntry.use != undefined)
                {
                	store = storeEntry.use;
                }
                
                var idPath = null;
                if (entry.model.controller && entry.model.controller.set)
                {
                	idPath = entry.model.controller.set.modelPath;
                	delete entry.model.controller.set.modelPath;
                	bidirectional = entry.model.controller.bidirectional != undefined? entry.model.controller.bidirectional : true;
                }

                controller = this.build(entry.model.controller);

                controller.setTarget(obj);
                
                if (store)
                {
                	store.bind("model" + (entry.model.controller.items && !qx.lang.String.startsWith(entry.model.controller.items, "[") ? "." + entry.model.controller.items : entry.model.controller.items ? entry.model.controller.items : ""), controller, "model");
                }
            }
            if (form)
            {
                if (qx.Class.hasInterface(clazz, qx.ui.core.IMultiSelection))
                {
                    target = controller;
                    targetProperty = "selection";
                }
                else if (qx.Class.hasInterface(clazz, qx.ui.core.ISingleSelection))
                {
                    targetProperty = "modelSelection[0]";
                    if (idPath)
                    {
                    	this._getFormController(form).addBindingOptions(entry.id, target, targetProperty, bidirectional, 
	                	{
	                		converter: function(data)
	                		{
	                			var model = controller.getModel();
	                			if (model)
	                			{
	                				for (var i = 0; i < model.getLength(); i++) 
	                				{
	                					if (model.getItem(i).get(idPath) == data) return model.getItem(i);
	                				}
	                			}
	                		}
	                	}, {
	                		converter: function(data)
	                		{
	                			if (data)
	                			{
	                				return data.get(idPath);
	                			}
	                			return data;
	                		}
	                	});
                    	return;
                    }
                }
                this._getFormController(form).addBindingOptions(entry.id, target, targetProperty, bidirectional);
            }
            
        },


        /**
         * TODOC
         *
         * @param widget {var} TODOC
         * @param entry {var} TODOC
         * @return {void} 
         */
        __configureLayout : function(widget, entry)
        {
            if (entry.layout != null)
            {
                var layout = new entry.layout.create();

                for (var set in entry.layout.set)
                {
                    if (qx.lang.Type.isArray(entry.layout.set[set]))
                    {
                        for (var i=0; i<entry.layout.set[set].length; i++)
                        {
                            if (qx.lang.Type.isArray(entry.layout.set[set][i]))
                            {
                                layout["set" + qx.Bootstrap.firstUp(set)].apply(layout, entry.layout.set[set][i]);
                                continue;
                            }

                            layout["set" + qx.Bootstrap.firstUp(set)].apply(layout, entry.layout.set[set]);
                            break;
                        }
                    }
                    else
                    {
                        layout.set(set, entry.layout.set[set]);
                    }
                }

                widget.setLayout(layout);

                if (entry.layout.init) {
                    entry.layout.init.call(layout);
                }
            }
        },


        /**
         * TODOC
         *
         * @param widget {var} TODOC
         * @param entry {var} TODOC
         * @return {void} 
         */
        __addBindings : function(widget, entry)
        {
            if (entry.bind)
            {
                for (var i=0; i<entry.bind.length; i++)
                {
                    var bind = entry.bind[i];
                    
                    var target = qx.Bootstrap.isString(bind.target) ? this.getById(bind.target) : bind.target;
                    if (target)
                    {
                        if (qx.Class.hasInterface(widget.constructor, UIBuilder.ui.form.IForm) && bind.type == 'field') {
                            this._getFormController(widget).addBindingOptions(bind.targetProperty, target, bind.property? bind.property : entry.id, bind.bidirectional, bind.toModel, bind.toSerialize);
                        } else {
                            widget.bind(bind.property, target, bind.targetProperty, bind.options);
                        }
                    }
                    else if (qx.Bootstrap.isString(bind.target))
                    {
                        this.__bindQueue[bind.target] = this.__bindQueue[bind.target] || {};
                        this.__bindQueue[bind.target].bind = this.__bindQueue[bind.target].bind || [];

                        this.__bindQueue[bind.target].bind.push(
                        {
                            type           : bind.type,
                            from           : widget,
                            fromProperty   : bind.property,
                            targetProperty : bind.targetProperty,
                            options        : bind.options,
                            toModel		   : bind.toModel,
                            toSerialize    : bind.toSerialize,
                            bidirectional  : bind.bidirectional
                        });
                    }
                }
            }
        },


        /**
         * TODOC
         *
         * @param widget {var} TODOC
         * @param entry {var} TODOC
         * @return {void} 
         */
        __addListeners : function(widget, entry)
        {
            var events = entry.listen;

            if (events)
            {
                var String = qx.lang.String;
                var base = "_on" + (entry.id ? String.firstUp(this.underlineCamelCase(entry.id)) : "");
                var conf, func, context;

                for (var i=0, l=events.length; i<l; i++)
                {
                    conf = events[i];

                    if (conf.handler) {
                        func = conf.handler;
                    } else {
                        func = base + String.firstUp(conf.event);
                    }

                    func = qx.lang.Type.isString(func) ? this[func] : func;

                    if (qx.core.Variant.isSet("qx.debug", "on"))
                    {
                        if (!func)
                        {
                            this.error('Missing method: ' + func + ' to add event listener "' + conf.event + '" to instance of class "' + entry.create.classname + '"');
                            continue;
                        }
                    }

                    context = conf.context ? conf.context : this;
                    widget.addListener(conf.event, func, context, conf.capture);
                }
            }
        },


        /**
         * TODOC
         *
         * @param entry {var} TODOC
         * @return {void} 
         * @throws TODOC
         */
        __validateEntry : function(entry)
        {
            if (!entry.create && !entry.use) {
                throw new Error("Missing create information to select class to create or use! (#" + entry.id + ")");
            }

            if (entry.listen && !entry.id) {
                throw new Error('Missing ID to add event listeners to instance of class "' + entry.create.classname + '"');
            }
        },


        /**
         * TODOC
         *
         * @param id {var} TODOC
         * @return {Object | null} TODOC
         */
        getById : function(id)
        {
            var db = this.__widgetRegistry;

            if (db)
            {
                var obj = db[id];

                if (obj) {
                    return obj;
                }
            }

            this.warn("Missing widget with ID: " + id);
            return null;
        },


        /**
         * TODOC
         *
         * @param obj {Object} TODOC
         * @param data {var} TODOC
         * @param value {var} TODOC
         * @return {void | Object | var} TODOC
         */
        _set : function(obj, data, value)
        {
            var setter = qx.core.Property.$$method.set;

            if (qx.Bootstrap.isString(data))
            {
                if (!obj[setter[data]])
                {
                    if (obj["set" + qx.Bootstrap.firstUp(data)] != undefined)
                    {
                        obj["set" + qx.Bootstrap.firstUp(data)](value);
                        return;
                    }
                    else if (qx.lang.String.contains(data, "."))
                    {
                        if (this._setNested(obj, data, value)) {
                            return obj;
                        }
                    }

                    if (qx.core.Variant.isSet("qx.debug", "on")) {
                        this.warn("No such property: " + data);
                    }

                    return obj;
                }

                return obj[setter[data]](value);
            }
            else
            {
                for (var prop in data)
                {
                    if (!obj[setter[prop]])
                    {
                        if (obj["set" + qx.Bootstrap.firstUp(prop)] != undefined)
                        {
                            obj["set" + qx.Bootstrap.firstUp(prop)](data[prop]);
                            continue;
                        }
                        else if (qx.lang.String.contains(prop, "."))
                        {
                            if (this._setNested(obj, prop, data[prop])) {
                                continue;
                            }
                        }

                        if (qx.core.Variant.isSet("qx.debug", "on")) {
                            this.warn("No such property: " + prop);
                        }

                        continue;
                    }

                    obj[setter[prop]](data[prop]);
                }

                return obj;
            }
        },


        /**
         * TODOC
         *
         * @param obj {Object} TODOC
         * @param prop {var} TODOC
         * @param value {var} TODOC
         * @return {boolean} TODOC
         */
        _setNested : function(obj, prop, value)
        {
            var atts = qx.util.StringSplit.split(prop, ".");
            var obj_to_set = obj;

            for (var i=0, len=atts.length; i<len; i++)
            {
                if (i == (len - 1))
                {
                    obj_to_set.set(atts[i], value);
                    return true;
                }
                else
                {
                    obj_to_set = obj_to_set.get(atts[i]);

                    if (!obj_to_set) {
                        break;
                    }
                }
            }

            return false;
        },
        
        /**
         * Add children to the current widget
         * 
         */
        addChildren : function (entries)
        {
        	if (!qx.lang.Type.isArray(entries))
        	{
        		this.error("'addChildren' method expects an array.");
        		return;
        	}
        	for (var i = 0; i < entries.length; i++)
            {
            	this.add(this.build(entries[i]), entries[i].position);
            }
        },
        
        underlineCamelCase : function(str)
        {
          return str.replace(/\_([a-z])/g, function(match, chr) {
            return chr.toUpperCase();
          });
        }
    }
});