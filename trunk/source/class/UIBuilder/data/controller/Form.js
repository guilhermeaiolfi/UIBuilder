/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * <h2>Form Controller</h2>
 *
 * *General idea*
 *
 * The form controller is responsible for connecting a from with a model. If no
 * model is given, a model can be created. This created form will fit exactly
 * to the given form and can be used for serialization. All the connections
 * between the form items and the model are handled by an internal
 * {@link qx.data.controller.Object}.
 *
 * *Features*
 *
 * * Connect a form to a model (bidirectional)
 * * Create a model for a given form
 *
 * *Usage*
 *
 * The controller only work if both, a controller and a model are set.
 * Creating a model will automatically set the created model.
 *
 * *Cross reference*
 *
 * * If you want to bind single values, use {@link qx.data.controller.Object}
 * * If you want to bind a list like widget, use {@link qx.data.controller.List}
 * * If you want to bind a tree widget, use {@link qx.data.controller.Tree}
 */
qx.Class.define("UIBuilder.data.controller.Form",
{
    extend : qx.core.Object,


    /**
         * @param model {qx.core.Object | null} The model to bind the target to. The
         *   given object will be set as {@link #model} property.
         * @param target {qx.ui.form.Form | null} The form which contains the form
         *   items. The given form will be set as {@link #target} property.
         */
    construct : function(model, target)
    {
        this.base(arguments);

        this.__bindingOptions = {};

        if (model != null) {
            this.setModel(model);
        }

        if (target != null) {
            this.setTarget(target);
        }
    },

    properties :
    {

        /** Data object containing the data which should be shown in the target. */
        model :
        {
            check    : "qx.core.Object",
            apply    : "_applyModel",
            event    : "changeModel",
            nullable : true
        },

        /** The target widget which should show the data. */
        target :
        {
            check    : "UIBuilder.ui.form.IForm",
            apply    : "_applyTarget",
            event    : "changeTarget",
            nullable : true,
            init     : null
        }
    },

    members :
    {
        __objectController : null,
        __bindingOptions : null,


        /**
         * The form controller uses for setting up the bindings the fundamental
         * binding layer, the {@link qx.data.SingleValueBinding}. To achieve a
         * binding in both directions, two bindings are neede. With this method,
         * you have the oppertunity to set the options used for the bindings.
         *
         * @param name {String} The name of the form item for which the options
         *       should be used.
         * @param target {var} TODOC
         * @param targetProperty {var} TODOC
         * @param bidirectional {var} TODOC
         * @param model2target {Map} Options map used for the binding from model
         *       to target. The possible options can be found in the
         *       {@link qx.data.SingleValueBinding} class.
         * @param target2model {Map} Optiosn map used for the binding from target
         *       to model. The possible options can be found in the
         *       {@link qx.data.SingleValueBinding} class.
         * @return {void} 
         */
        addBindingOptions : function(name, target, targetProperty, bidirectional, model2target, target2model)
        {
    		//console.log(name, target, targetProperty, bidirectional, model2target, target2model);
            if (bidirectional == undefined) {
                bidirectional = true;
            }

            // console.log(name, target, targetProperty, model2target, target2model);
            this.__bindingOptions[name] =
            {
                target         : target,
                targetProperty : targetProperty,
                model2target   : model2target,
                target2model   : target2model,
                bidirectional  : bidirectional
            };

            // return if not both, model and target are given
            if (this.getModel() == null || this.getTarget() == null) {
                return;
            }
            
           	this.__objectController.removeTarget(target, targetProperty, name);

            // set up the new binding with the options
            this.__objectController.addTarget(target, targetProperty, name, bidirectional, model2target, target2model);
            
        },


        /**
         * Creates and sets a model using the {@link qx.data.marshal.Json} object.
         * Remember that this method can only work if the form is set. The created
         * model will fit exactly that form. Changing the form or adding an item to
         * the form will need a new model creation.
         *
         * @param includeBubbleEvents {Boolean} Whether the model should support
         *       the bubbling of change events or not.
         * @return {qx.core.Object} The created model.
         * @throws TODOC
         */
        createModel : function(includeBubbleEvents)
        {
            var target = this.getTarget();

            // throw an error if no target is set
            if (target == null) {
                throw new Error("No target is set.");
            }

            var items = target.getItems();
            var data = {};

            for (var name in items)
            {
                var names = name.split(".");
                var currentData = data;

                for (var i=0; i<names.length; i++)
                {
                    // if its the last item
                    if (i + 1 == names.length)
                    {
                        // check if the target is a selection
                        var clazz = items[name].constructor;

                        if (qx.Class.hasInterface(clazz, qx.ui.core.ISingleSelection) || qx.Class.hasInterface(clazz, qx.ui.core.IMultiSelection)) {
                            currentData[names[i]] = items[name].getModelSelection();
                        } else {
                            currentData[names[i]] = items[name].getValue();
                        }
                    }
                    else
                    {
                        // if its not the last element, check if the object exists
                        if (!currentData[names[i]]) {
                            currentData[names[i]] = {};
                        }

                        currentData = currentData[names[i]];
                    }
                }
            }

            var model = qx.data.marshal.Json.createModel(data, includeBubbleEvents);
            this.setModel(model);
            return model;
        },

        // apply method
        /**
         * TODOC
         *
         * @param value {var} TODOC
         * @param old {var} TODOC
         * @return {void} 
         */
        _applyTarget : function(value, old)
        {
            // if an old target is given, remove the binding
            if (old != null) {
                this.__tearDownBinding(old);
            }

            // do nothing if no target is set
            if (this.getModel() == null) {
                return;
            }

            // target and model are available
            if (value != null) {
                this.__setUpBinding();
            }
        },

        // apply method
        /**
         * TODOC
         *
         * @param value {var} TODOC
         * @param old {var} TODOC
         * @return {void} 
         */
        _applyModel : function(value, old)
        {
            // first, get rid off all bindings (avoids whong data population)
            if (this.__objectController != null)
            {
                var items = this.getTarget().getItems();

                for (var name in items)
                {
                    var item = items[name];
                    var options = this.__bindingOptions[name];
                    
                    var targetProperty = null, target = item;
                    if (options)
                    {
                    	targetProperty = options['targetProperty'];
                    	target = options.target? options.target : item;
                    }
                    else
                    {
                    	targetProperty = this.__getTargetProperty(item);
                    }
	            	this.__objectController.removeTarget(target, targetProperty, name);
                }
            }

            // set the model of the object controller if available
            if (this.__objectController != null) {
                this.__objectController.setModel(value);
            }

            // do nothing is no target is set
            if (this.getTarget() == null) {
                return;
            }

            // model and target are available
            if (value != null) {
                this.__setUpBinding();
            }
        },


        /**
         * TODOC
         *
         * @param item {var} TODOC
         * @param targetProperty {var} TODOC
         * @return {var} TODOC
         */
        __getTargetProperty : function(item) {
            if (this.__isModelSelectable(item))
            {
            	if (this.__isMultiModelSelectable(item))
            	{
            		if (item["set" + "ModelSelection"]) return "modelSelection";
            		return "selection";
            	}
            	else
        		{
            		if (item["set" + "ModelSelection"]) return "modelSelection[0]";
            		return "selection[0]";
        		}
            }
            return "value";
        },

        /**
         * Internal helper for setting up the bindings using
         * {@link qx.data.controller.Object#addTarget}. All bindings are set
         * up bidirectional.
         *
         * @return {void} 
         */
        __setUpBinding : function()
        {
            // create the object controller
            if (this.__objectController == null) {
                this.__objectController = new qx.data.controller.Object(this.getModel());
            }

            // get the form items
            var items = this.getTarget().getItems();

            // connect all items
            for (var name in items)
            {
                var item = items[name];

                var options = this.__bindingOptions[name];

                var targetProperty = this.__getTargetProperty(item);
                
                var target = item, model2target = null, target2model = null;
                
                if (options)
                {
                	target = options.target? options.target : item;
                	if (options.targetProperty)
                	{
                		targetProperty = options.targetProperty;
                	}
                	model2target = options.model2target;
                	target2model = options.target2model;
                }
                this.__objectController.addTarget(target, targetProperty, name, true, model2target, target2model);
            }
        },


        /**
         * Internal helper for removing all set up bindings using
         * {@link qx.data.controller.Object#removeTarget}.
         *
         * @param oldTarget {qx.ui.form.Form} The form which has been removed.
         * @return {void} 
         */
        __tearDownBinding : function(oldTarget)
        {
            // do nothing if the object controller has not been created
            if (this.__objectController == null) {
                return;
            }

            // get the items
            var items = oldTarget.getItems();

            // disconnect all items
            for (var name in items)
            {
                var item = items[name];
                var targetProperty = this.__bindindsOptions[name][targetProperty];
                this.__objectController.removeTarget(item, targetProperty, name);
            }
        },


        /**
         * Returns whether the given item implements
         * {@link qx.ui.core.ISingleSelection} and
         * {@link qx.ui.form.IModelSelection}.
         *
         * @param item {qx.ui.form.IForm} The form item to check.
         * @return {true} true, if given item fits.
         */
        __isSingleModelSelectable : function(item) {
            return qx.Class.hasInterface(item.constructor, qx.ui.core.ISingleSelection);
        },


        /**
         * TODOC
         *
         * @param item {var} TODOC
         * @return {var} TODOC
         */
        __isMultiModelSelectable : function(item) {
            return qx.Class.hasInterface(item.constructor, qx.ui.core.IMultiSelection);
        },


        /**
         * TODOC
         *
         * @param item {var} TODOC
         * @return {var} TODOC
         */
        __isModelSelectable : function(item) {
            return (qx.Class.hasInterface(item.constructor, qx.ui.core.ISingleSelection) && qx.Class.hasInterface(item.constructor, qx.ui.form.IModelSelection)) || (qx.Class.hasInterface(item.constructor, qx.ui.core.IMultiSelection) && qx.Class.hasInterface(item.constructor, qx.ui.form.IModelSelection));
        }
    }
});