/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2008 Christian Boulanger

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Christian Boulanger (cboulanger)

************************************************************************ */

/* ************************************************************************


************************************************************************ */

/**
 * Adds autocompletion to a widget that allows entering values.
 * Currently, qx.ui.form.(TextField|TextArea|ComboBox) are supported.
 * 
 * The model is a qx.core.object marshalled from json data (using, for example
 * qx.data.marshal.Json.create() ), with the following structure:
 * 
 * { "input" : "fragment",
 *   "suggestions" : ["fragment","fragmentation","fragmentabolous","fragmentive",...]
 * }
 * 
 * The "input" property contains the input fragment to match, the suggestions are an 
 * array of values that match the input fragment. Usually, the model would be 
 * marshalled from data received by the server. Most conveniently, you can connect
 * the controller qith a qc.data.store.Json (see below).
 * 
 * Autocompletion is not limited to single-value fields, i.e. fields that contain
 * only one value. You can also use separators such as semicolon, comma or newline
 * to use autocomplete for the individual values. For example, in the "TO" field
 * of an email client, you can use autocomplete for each email address, without having
 * to use several separate text fields. 
 * 
 * Code examples:
 * 
 * Autocomplete with a single-value ComboBox
 * 
 * <pre>
 * var store = new qcl.data.store.JsonRpc(null, "my.service");
 * store.setAutoLoadMethod("myAutoCompleteValuesMethod");
 * var combobox = new qx.ui.form.ComboBox();
 * var controller = new qcl.data.controller.AutoComplete(null,combobox);
 * controller.bind("input", store, "autoLoadParams",{
 *   'converter' : function( input ){ return input ? ["param1", "param2", "param3", input] : null } 
 * });
 * store.bind("model", controller,"model");
 * </pre>
 * 
 * Autocomplete with a multi-valued TextField which contains values separated
 * by a semicolon (";"). In the database backend, values are also separated by 
 * ";" in the database column data:
 * 
 * <pre>
 * var store = new qcl.data.store.JsonRpc(null, "my.service");
 * store.setAutoLoadMethod("myAutoCompleteValuesMethod");
 * var textfield = new qx.ui.form.TextField();
 * var controller = new qcl.data.controller.AutoComplete(null,textfield, ";",true);
 * controller.bind("input", store, "autoLoadParams",{
 *   'converter' : function( input ){ return input ? ["param1", "param2", "param3", input, ';' ] : null } 
 * });
 * store.bind("model", controller,"model");
 * </pre>
 * 
 * Autocomplete with a multi-valued TextArea which contains values separated
 * by newline. In the database backend, values are separated by ";" in the
 * database column data:
 * 
 * <pre>
 * var store = new qcl.data.store.JsonRpc(null, "my.service");
 * store.setAutoLoadMethod("myAutoCompleteValuesMethod");
 * var textarea = new qx.ui.form.TextArea();
 * var controller = new qcl.data.controller.AutoComplete(null,textarea,"\n");
 * controller.bind("input", store, "autoLoadParams",{
 *   'converter' : function( input ){ return input ? ["param1", "param2", "param3", input, ';' ] : null } 
 * });
 * store.bind("model", controller,"model");
 * </pre>
 */
qx.Class.define("UIBuilder.data.controller.AutoComplete",
{
  extend : qx.core.Object,
  
  events:
  {
	"selected" : "qx.event.type.Data",
	"nothing"  : "qx.event.type.Data"
  },
  
  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /** 
     * The autocomplete data model 
     */
    model :
    {
      check    : "qx.core.Object",
      nullable : true,
      apply    : "_applyModel"
    },

    /**
     * The path from the suggestion obj to show
     */
    labelPath:
    {
    	check	: "String",
    	nullable: true,
    	init	: "",
    	event	: "changeLabelPath"
    },
    
    /** 
     * The autocomplete target
     */
    target :
    {
      check    : "qx.core.Object",
      nullable : true,
      apply    : "_applyTarget"
    },    
    
    /**  
     * Separator for multi-valued texts 
     */
    separator :
    {
      init : "",
      nullable : true
    },    
    
    /**  
     * Whether an additional space should be inserted after the
     * separator for aestetic reasons.
     */
    additionalSpace :
    {
      check : "Boolean",
      init : false 
    },        

    /**  
     * Delay between keysstrockes in milliseconds before autocompleting action
     * is activated. this prevents that too many requests are dispatches when
     * typing quickly.
     */
    delay :
    {
      check : "Integer",
      init : 500,
      nullable : false
    },
    
    /**  
     * Minimum number of characters that are needed before autocompletion is triggered
     * This can be used to tune the size of the results dependent on the size
     * of the data.
     */
    minCharNumber :
    {
      check : "Integer",
      init : 3,
      nullable : false
    },
    
    /**  
     * Property that is set when user has typed in a value that should
     * be autocompleted. This property can be used to bind to trigger the
     * reloading of store data. 
     */
    input :
    {
      check    : "String",
      nullable : true,
      event    : "changeInput"
    },    
    
    /**
     * The text field used for autocompletion
     */
    textField :
    {
      check : "qx.ui.form.AbstractField",
      nullable : true
    }

  },
  
  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * Constructor.
   * @param model {qx.core.Object} The model of the autocomplete data
   * @param target {qx.ui.form.TextField|qx.ui.form.TextArea|qx.ui.form.ComboBox}
   * @param separator {String ? undefined} If given, use as separator
   * @param additionalSpace {Boolean ? undefined} Whether to add an additional
   * space character after separators such as a semicolon (for aesthetic purposes
   * only).
   */
  construct : function( model, target, separator, additionalSpace )  
  {
	  if ( model !== undefined )
    {
      this.setModel( model );
    }
    
    if ( target !== undefined )
    {
      this.setTarget( target );
    }
    
    if ( separator !== undefined )
    {
      this.setSeparator( separator );
    }
    
    if ( additionalSpace !== undefined )
    {
      this.setAdditionalSpace( additionalSpace );
    }
  },
  
  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    
    /* 
    ---------------------------------------------------------------------------
       APPLY METHODS
    ---------------------------------------------------------------------------
    */   
    
    /**
     * Apply the model. This can also be the result of a json store that
     * has loaded from the server
     * @param model {qx.core.Object ? null}
     * @param old {qx.core.Object ? null}
     */
    _applyModel : function( model, old )
    {
      if ( model )
      {
        this._handleModelChange();
      }
    },
    
    /**
     * Apply the target
     * @param model {qx.core.Object ? null}
     * @param old {qx.core.Object ? null}
     */
    _applyTarget : function( target, old )
    {
      /*
       * to what widget has this mixin been applied?
       */
      switch ( target.classname )
      {
        /*
         * valid widgets
         */
        case "qx.ui.form.TextField":
        case "qx.ui.form.TextArea":
          this.setTextField(target);
          break;
        case "qx.ui.form.ComboBox":
          this.setTextField( target.getChildControl("textfield") );
          break;
          
        default:
          this.error("Invalid widget!");
          return;
      }
     
      /*
       * setup or remove event listeners
       */
      var tf = this.getTextField();
      if ( old )
      {
        tf.removeListener("keydown", this._handleTextFieldKeypress,this);
        tf.removeListener("input",this._on_changeInput,this);
      }      
      
      if ( target )
      {
        this._lastKeyPress = (new Date).valueOf();
        tf.addListener("keydown", this._handleTextFieldKeypress,this);
        tf.addListener("input",this._on_changeInput,this);
      }

    },    


    /**
     * Handles the keypress event of the textfield
     *
     * @param e {qx.event.type.KeyEvent} keyPress event
     * @return {void}
     */
    _handleTextFieldKeypress : function(e)
    {
      var key = e.getKeyIdentifier();
      var tf  = this.getTextField();
      console.log("Keypress event:" +  key );
      
      var selLength = tf.getTextSelectionLength();
      console.log("Selection length:" + selLength);
      
      switch( key )
      {
        /* 
         * pressing enter when text is selected should
         * not delete the text, this is the common
         * user experience for autocomplete, i.e. in 
         * openoffice
         */        
        case "Enter": 
          
          if ( selLength > 0 )
          {
            console.log("Putting caret at the end of the selection");
            var selStart  = tf.getTextSelectionStart();
            tf.setTextSelection( selStart+selLength,selStart+selLength);
            this.fireDataEvent("selected", this.__currentSelected);
            e.preventDefault();
          }
          break;
        
        /*
         * Pressing backspace should prevent autocomplete 
         */
        case "Backspace":
          this.__preventAutocomplete = true;
          break;
          
        /*
         * turn off the prevent flag on next keystroke
         */
        default:
          this.__preventAutocomplete = false;
          break;
        
      }
     
    },

    /**
     * event handler for event triggering the autocomplete action
     */    
    _on_changeInput : function(e)
    {
      
      if ( this.__preventAutocomplete )
      {
        console.log("Not handling changeInput event...");
        return;
      }
      
      var tf =  this.getTextField();
      
      /*
       * get and save current content of text field
       */
      var content = e.getData();  
      console.log("Handling changeInput event, content: " + content );
      
    	/*
    	 * delay before sending request
    	 */
      var now = (new Date).valueOf(); 
      
      if (( now - this._lastKeyPress) < this.getDelay() ) 
      {
        console.log( "delay not reached");
        this._lastKeyPress = now;
        
        /*
         * if we have a timeout function, cancel it
         */
        if ( this.__deferredInput )
        {
          window.clearTimeout(this.__deferredInput);
        }
        
        /*
         * create a timeout to call this event handler again
         * after delay
         */
        var _this = this;
        this.__deferredInput = window.setTimeout(function(){
          _this._on_changeInput(e);
        }, this.getDelay() );
        return;
      }
      
      var start, end;
      
      /*
       * separator for multi-valued fields
       */
      var sep = this.getSeparator();
       
      if ( sep )
      {  
        start = tf.getTextSelectionStart();
        console.log( "Selection start: " + start );
        
        /*
         * rewind
         */
        while ( start > 0  && content.charAt(start-1) != sep ) start--;
         
        /*
         * forward
         */
        end = start;
        while ( end < content.length && content.charAt(end) != sep ) end++;
      }
      else
      {
        start = 0;
        end   = content.length;
      }
      
      /*
       * text fragment
       */
      var input = qx.lang.String.trim( content.substring( start, end ) );
      console.log( "Input is '" + input +"'");
      
      /*
       * do not start query if only whitespace has been added
       */
       if ( qx.lang.String.trim( input ) != input )
       {
         console.log("Only whitespace added ...");
         return;
       }
      
      /*
       * Store timestamp
       */
      this._lastKeyPress = (new Date).valueOf();

      /*
       * if we have model data, search this first
       */
      var model = this.getModel();
      
      if( model )
      {
        console.log("Using existing model data...");
        var suggestions = model.getSuggestions().toArray();
        console.log( suggestions.length  + " suggestions.");
        for ( var i=0; i<suggestions.length; i++ )
        {
          var item = suggestions[i];
          
          var str = this.getLabelPath()? item.get(this.getLabelPath()) : item;
          console.log( "Next item: '" + str.substring(0,input.length ) + "'");
          if ( str.substring(0,input.length ) == input )
          {
            console.log( "... matches! " );
            model.setInput( input );
            suggestions.unshift( item );
            model.setSuggestions( new qx.data.Array( suggestions ) );
            this._handleModelChange();
            return true;
          }
          else
          {
            console.log( "...doesn't match." );
          }
        }
      }      
      
      /*
       * Send request if we have enough characters
       */
      if ( input.length >= this.getMinCharNumber() )
      {
        console.log( "sending request for " + input );
        this.setInput(input);  
      }
      else
      {
        console.log("Not enough characters...");
      }

    },    
  
    /**
     * Called when autocomplete data is available
     */  
    _handleModelChange : function ()
    {
      /*
       * compare the input that was used to query
       * the autocompletion data and the current input
       */
      var tf = this.getTextField();
      var content = tf.getValue() || ""; 
      
      var model = this.getModel();
      var input = model.getInput();
      
      var suggestions = model.getSuggestions().toArray();
      
      /*
       * if nothing to match, abort
       */
      if ( ! model || ! content || ! input || ! suggestions || suggestions.length == 0 )
      {
        console.log( [model,content,input,suggestions]);
        console.log( "Nothing to match, aborting...");
		this.fireDataEvent("nothing", null);
        return false;
      }
      console.log( suggestions.toString() );
      
      var match, start, end; 
      
      /*
       * separator for multi-value fields
       */
      var sep = this.getSeparator();                            
      if ( sep )
      {
        console.log("Separator '"+sep+"'");
        /*
         * rewind
         */
        start = tf.getTextSelectionStart();
        while ( start > 0 && content.charAt(start-1) != sep ) start--;
        
        /*
         * forward
         */
        end = start;
        while ( end < content.length && content.charAt(end) != sep ) end++;
        console.log("Selecting from " + start + " to " + end);
      }
      else
      {
        start = 0;
        end   = content.length;
        //match = qx.lang.String.trim( content.substring( start, end-1 ) );
      }
      
      /*
       * get text fragment
       */
      match = qx.lang.String.trim( content.substring( start, end ) ); 
      console.log ("trying to match response '" +  match + "' with input '" + input  + "'." );
      
      /*
       * check whether input is still the same so that latecoming request
       * do not mess up the content
       */
      if ( input != match )
      {
        console.log ("Response doesn't fit current input: '" +   match + "' != '" + input + "'." );
        return false;
      }
      
      /*
       * apply matched text and suggestion to content
       */
      var suggestion = suggestions[0];
      var pre  = content.substring(0,start);
      var post = content.substring(end);
      var str = this.getLabelPath()? suggestion.get(this.getLabelPath()) : suggestion; 
      if( pre.length && this.getAdditionalSpace() )
      {
        pre += " ";
      }
      end = (pre + str).length;
      console.log( "'" + pre + "' + '"+ str + "' + '" + post +"'" );
      
      /* 
       * set value, preventing that other parts of this 
       * controller to mess this up.
       */ 
      this.__preventAutocomplete = true;      
      tf.setValue( pre + str + post );
      this.__currentSelected = suggestion;
      this.__preventAutocomplete = false;
      
      /*
       * select the added text
       */
      qx.event.Timer.once( function(){
        console.log("TextSelection: " + start+input.length + " - " + end );
        tf.setTextSelection( start+input.length, end );
      },this,10);
    }
  }

});