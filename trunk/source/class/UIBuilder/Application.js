qx.Class.define("UIBuilder.Application",
{
  extend : qx.application.Standalone,
  include : [ UIBuilder.MBuilder ],




  /*
    *****************************************************************************
       MEMBERS
    *****************************************************************************
    */

  members :
  {
    /**
     * Main method - application start point
     *
     * @return {void} 
     */
    main : function()
    {
      this.base(arguments);

      // Add log appenders
      if (qx.core.Variant.isSet("qx.debug", "on"))
      {
        qx.log.appender.Native;
        qx.log.appender.Console;

        if (qx.bom.client.Engine.MSHTML) {
          qx.log.appender.Console.init();
        }
      }

      /*
            var window = new playground.jsqt.TelephoneCompareWindow();
            this.getRoot().add(window);
            window.open();
            */

      var bt = new qx.ui.form.Button('Push me');

      bt.addListener("execute", function(e) {
        this.getById('mainWindow').open();
      }, this);

      this.getRoot().add(bt);

      var definition =
      {
        create : qx.ui.window.Window,
        id : "mainWindow",
        lazy : true,
        set : { width : 400 },

        layout :
        {
          create : qx.ui.layout.HBox,
          set    : { spacing : 10 }
        },

        add : [
        {
          create : UIBuilder.ui.form.Form,
          id : "form",

          model :
          {
            controller :
            {
              id     : 'formController',
              create : UIBuilder.data.controller.Form
            }
          },

          bind : [
          {
            type           : 'field',
            targetProperty : 'tree',
            target         : 'treeController',
            property       : 'selection',
            toSerialize    : { converter : this.converterToIds("id") },
            toModel        : { converter : this.converterToModel('treeController', "selection", "id") }
          } ],

          set :
          {
            "validationManager.validator" : function(items) {
              return true;
            }
          },

          layout :
          {
            create : qx.ui.layout.Grid,

            set :
            {
              spacingX   : 10,
              spacingY   : 10,
              columnFlex : [ 0, 1 ],
              rowFlex    : [ [ 1, 1 ], [ 2, 1 ] ]
            },

            init : function() {}
          },

          // this.setColumnFlex(0, 1);
          position : { flex : 1 },

          add : [
          {
            id : "tree",
            create : UIBuilder.ui.tree.Tree,

            set :
            {
              width          : 200,
              selectionMode  : 'multi',
              required       : true,
              invalidMessage : "You need to select one node"
            },

            // requiredFieldMessage: "selecione algum nó rá"
            position :
            {
              rowSpan : 5,
              column  : 0,
              row     : 0
            },

            model :
            {
              store :
              {
                create : UIBuilder.data.store.Array,
                items : "[0]",

                set :
                {
                  data : [
                  {
                    id : 1,
                    label : "node",

                    children : [
                    {
                      id    : 2,
                      label : "node child"
                    } ]
                  } ]
                }
              },

              controller :
              {
                id : 'treeController',
                create : qx.data.controller.Tree,

                set :
                {
                  labelPath : "label",
                  childPath : "children",
                  modelPath : "id"
                }
              }
            }
          },

          /* ,
                    init: function(obj)
                    {
                      obj.setRoot(this.getById('treeRoot'));
                    },
                    add:[{
                       id: 'treeRoot',
                       create: qx.ui.tree.TreeFolder,
                       set:{
                         label: "teste",
                         open: true
                      },
                      init: function()
                      {
                        //console.log("aaaaa");
                      }
                    }] */

          {
            create : qx.ui.basic.Label,
            set : { value : this.tr("What are you doing?") },

            position :
            {
              row    : 1,
              column : 1
            }
          },

          {
            create : qx.ui.basic.Label,
            id : "countdown",

            set :
            {
              value  : "140",
              alignX : 'right'
            },

            position :
            {
              row    : 1,
              column : 2
            }
          },

          {
            create : qx.ui.form.TextArea,
            id : "um",

            set :
            {
              liveUpdate     : true,
              value          : 'um',
              required       : true,
              invalidMessage : "Try to type \"one\""
            },

            validator : this._umValidator,
            listen : [ { event : "changeValue" } ],

            position :
            {
              row     : 2,
              column  : 1,
              colSpan : 2
            },

            bind : [
            {
              property       : 'value',
              target         : bt,
              targetProperty : "label"
            } ]
          },

          {
            create : qx.ui.form.TextArea,
            id : "dois",

            set :
            {
              liveUpdate : true,
              value      : 'dois'
            },

            listen : [ { event : "changeValue" } ],

            position :
            {
              row     : 3,
              column  : 1,
              colSpan : 2
            },

            bind : [
            {
              property       : 'value',
              target         : 'um',
              targetProperty : "value"
            } ]
          },
          {
            create : qx.ui.basic.Label,
            id : 'selectBoxLabel',
            set : { value : 'Select' },

            position :
            {
              row    : 4,
              column : 1
            }
          },

          {
            create : qx.ui.form.SelectBox,
            id : 'selectBox',
            set : {},

            position :
            {
              row    : 4,
              column : 2
            },

            model :
            {
              store :
              {
                create : UIBuilder.data.store.Array,

                set :
                {
                  data : [
                  {
                    name : "male",
                    id   : 1
                  },
                  {
                    name : "female",
                    id   : 2
                  },
                  {
                    name : "dont know!",
                    id   : 3
                  },
                  {
                    name : "Alien",
                    id   : 4
                  } ]
                }
              },

              controller :
              {
                create : qx.data.controller.List,
                set    : { labelPath : "name" }
              }
            },

            // id: "id"
            init : function() {}
          } ],

          addButton : [
          {
            create : qx.ui.form.Button,
            id     : "resetButton",
            set    : { label : this.tr("Reset") },
            listen : [ { event : "execute" } ]
          },
          {
            create : qx.ui.form.Button,
            id     : "sendButton",
            set    : { label : this.tr("Send") },
            listen : [ { event : "execute" } ]
          } ]
        } ]
      };

      this.getRoot().add(this.build(definition));
      this.getById('mainWindow').open();
    },


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     * @return {void} 
     */
    _onResetButtonExecute : function(e) {
      this.getById('form').reset();
    },


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     * @return {void} 
     */
    _onSendButtonExecute : function(e)
    {
      if (this.getById('form').validate()) {
        console.log(qx.util.Json.parse(qx.util.Serializer.toJson(this.getById('formController').getModel())));
      } else {
        console.log("o-oh");
      }
    },


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     * @return {void} 
     */
    _onUmChangeValue : function(e) {
      this.getById('countdown').setValue(140 - e.getTarget().getValue().length + "");
    },


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     * @return {void} 
     */
    _onDoisChangeValue : function(e) {},


    /**
     * TODOC
     *
     * @param value {var} TODOC
     * @return {boolean} TODOC
     */
    _umValidator : function(value)
    {
      if (value == "one") {
        return true;
      } else {
        return false;
      }
    },


    /**
     * TODOC
     *
     * @param idPath {var} TODOC
     * @return {Function} TODOC
     */
    converterToIds : function(idPath)
    {
      return function(model)
      {
        // return model;
        var ret = new qx.data.Array();

        for (var i=0; i<model.getLength(); i++) {
          ret.push(model.getItem(i).get(idPath));
        }

        return ret;
      };
    },


    /**
     * TODOC
     *
     * @param target {var} TODOC
     * @param property {var} TODOC
     * @param idPath {var} TODOC
     * @return {Function} TODOC
     */
    converterToModel : function(target, property, idPath)
    {
      var ctx = this;

      return function(ids)
      {
        var obj = ctx.getById(target);
        var selection = obj.get(property);
        selection.splice(0, selection.getLength());
        var treeModel = obj.getModel();

        for (var i=0; i<ids.getLength(); i++)
        {
          var model = ctx._findModel(ids.getItem(i), treeModel, idPath, ctx);

          if (model) {
            selection.push(model);
          }
        }

        return selection;
      };
    },


    /**
     * TODOC
     *
     * @param id {var} TODOC
     * @param root {var} TODOC
     * @param idPath {var} TODOC
     * @param ctx {var} TODOC
     * @return {var | null} TODOC
     */
    _findModel : function(id, root, idPath, ctx)
    {
      if (root.get(idPath) == id) {
    	  
        return root;
      }

      if (root.getChildren)
      {
        for (var i=0; i<root.getChildren().getLength(); i++)
        {
          var model = ctx._findModel(id, root.getChildren().getItem(i), idPath, ctx);

          if (model) {
            return model;
          }
        }
      }

      return null;
    }
  }
});