
/*
 * Class responsable to handle form items.
 * Based on the work of Martin Wittemann from the qooxdoo's team.
 */

qx.Class.define("UIBuilder.ui.form.Form",
{
    extend : qx.ui.container.Composite,
    implement : [ UIBuilder.ui.form.IForm ],

    construct : function()
    {
        this.base(arguments);

        this.__fields = {};
        this.__buttons = [];
        this.__validationManager = new qx.ui.form.validation.Manager();
        this.__resetter = new qx.ui.form.Resetter();

        this._setLayout(new qx.ui.layout.VBox());

        this.__fieldsContainer = new qx.ui.container.Composite();
        this.__buttonsContainer = new qx.ui.container.Composite();
        this.__buttonsContainer.setMaxHeight(30);

        this.__buttonsContainer.setLayout(new qx.ui.layout.HBox(10, 'right'));

        this.__buttonsContainer.setHeight(30);

        this._add(this.__fieldsContainer, { flex : 1 });
        this._add(this.__buttonsContainer, { flex : 1 });
    },

    members :
    {
        __model : null,
        __fields : null,
        __validationManager : null,
        __buttons : null,
        __resetter : null,
        __fieldsContainer : null,
        __buttonsContainer : null,


        /**
         * TODOC
         *
         * @param item {var} sub item
         * @param position {var} position for the layout object
         * @return {void} 
         */
        add : function(item, position) {
            this.__fieldsContainer.add(item, position);
        },


        /**
         * add an item to the form
         *
         * @param id {var}
         * @param item {var}
         * @param entry {var}
         * @return {void} 
         */
        addItem : function(id, item, entry)
        {
            var clazz = item.constructor;
            this.__fields[id] = item;

            if (qx.Class.hasInterface(clazz, qx.ui.form.IForm) && id)
            {
                this.__resetter.add(item);
                this.__validationManager.add(item, entry.validator);
            }
        },


        /**
         * add a button to the bottom of the form
         *
         * @param button {var} button instance
         * @return {void} 
         */
        addButton : function(button)
        {
            this.__buttons.push(button);
            button.setAllowStretchY(false);
            button.setAlignY('middle');
            button.setAlignX('right');
            this.__buttonsContainer.add(button);
        },


        /**
         * set the layout of the form
         *
         * @param layout {var}
         * @return {void} 
         */
        setLayout : function(layout) {
            this.__fieldsContainer.setLayout(layout);
        },


        /**
         * reset the form
         *
         * @return {void} 
         */
        reset : function()
        {
            this.__resetter.reset();
            this.__validationManager.reset();
        },


        /**
         * redefine the item values to the current ones to be used to reset later 
         *
         * @return {void} 
         */
        redefineResetter : function() {
            this.__resetter.redefine();
        },


        /**
         * validares the form
         *
         * @return {bool} true if the form has valid values of false if it doesn't
         */
        validate : function() {
            return this.__validationManager.validate();
        },


        /**
         * get the validation manager
         *
         * @return {var} 
         */
        getValidationManager : function() {
            return this.__validationManager;
        },


        /**
         * get all buttons of the form
         *
         * @return {var} array of buttons
         */
        getButtons : function() {
            return this.__buttons;
        },


        /**
         * get all items of the form
         *
         * @return {var} array of IForm items
         */
        getItems : function() {
            return this.__fields;
        }
    }
});