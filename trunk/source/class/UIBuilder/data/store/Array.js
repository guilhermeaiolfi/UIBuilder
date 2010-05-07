qx.Class.define("UIBuilder.data.store.Array",
{
    extend : qx.core.Object,


    /**
         * @param delegate {Object?} The delegate containing one of the methods
         *   specified in {@link qx.data.store.IStoreDelegate}.
         */
    construct : function(delegate)
    {
        this.base(arguments);

        // store the marshaler and the delegate
        this._marshaler = new qx.data.marshal.Json(delegate);
        this._delegate = delegate;
    },

    events :
    {
        /**
                 * Data event fired after the model has been created. The data will be the
                 * created model.
                 */
        "loaded" : "qx.event.type.Data"
    },

    properties :
    {
        /**
                 * Property for holding the loaded model instance.
                 */
        model :
        {
            nullable : true,
            event    : "changeModel"
        },


        /**
                 * The state of the request as an url. If you want to check if the request
                 * did his job, use, the {@link #changeState} event and check for one of the
                 * listed values.
                 */
        state :
        {
            check : [ "configured", "completed" ],
            init  : "configured",
            event : "changeState"
        }
    },

    members :
    {
        // private members
        __request : null,
        _delegate : null,


        /**
         * TODOC
         *
         * @param data {var} TODOC
         * @return {void} 
         */
        setData : function(data)
        {
            // check for the data manipulation hook
            var del = this._delegate;

            if (del && qx.lang.Type.isFunction(del.manipulateData)) {
                data = this._delegate.manipulateData(data);
            }

            // create the class
            this._marshaler.toClass(data, true);

            // set the initial data
            this.setModel(this._marshaler.toModel(data));

            // fire complete event
            this.fireDataEvent("loaded", this.getModel());
        },


        /**
         * TODOC
         *
         * @return {var} TODOC
         */
        getData : function() {
            return this.getModel();
        }
    },




    /*
         *****************************************************************************
            DESTRUCT
         *****************************************************************************
         */

    destruct : function()
    {
        this._disposeObjects("_marshaler");
        this._delegate = null;
    }
});