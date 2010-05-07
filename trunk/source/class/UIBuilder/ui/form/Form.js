
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
         * @param item {var} TODOC
         * @param position {var} TODOC
         * @return {void} 
         */
        add : function(item, position) {
            this.__fieldsContainer.add(item, position);
        },


        /**
         * TODOC
         *
         * @param id {var} TODOC
         * @param item {var} TODOC
         * @param entry {var} TODOC
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
         * TODOC
         *
         * @param button {var} TODOC
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
         * TODOC
         *
         * @param layout {var} TODOC
         * @return {void} 
         */
        setLayout : function(layout) {
            this.__fieldsContainer.setLayout(layout);
        },


        /**
         * TODOC
         *
         * @return {void} 
         */
        reset : function()
        {
            this.__resetter.reset();
            this.__validationManager.reset();
        },


        /**
         * TODOC
         *
         * @return {void} 
         */
        redefineResetter : function() {
            this.__resetter.redefine();
        },


        /**
         * TODOC
         *
         * @return {var} TODOC
         */
        validate : function() {
            return this.__validationManager.validate();
        },


        /**
         * TODOC
         *
         * @return {var} TODOC
         */
        getValidationManager : function() {
            return this.__validationManager;
        },


        /**
         * TODOC
         *
         * @return {var} TODOC
         */
        getButtons : function() {
            return this.__buttons;
        },


        /**
         * TODOC
         *
         * @return {var} TODOC
         */
        getItems : function() {
            return this.__fields;
        }
    }
});