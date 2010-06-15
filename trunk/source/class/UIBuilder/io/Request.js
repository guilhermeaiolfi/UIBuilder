
/**
 * Request Wrapper 
 *
 * @author Guilherme R. Aiolfi
 * @since 2008-08-06
 */

qx.Class.define("UIBuilder.io.Request",
{
    extend : qx.io.remote.Request,

    properties:
    {
		maxAttempts: 
		{
			init: 3,
			event: "changeAttempts"
		}
    },
    
    /**
     * TODOC
     *
     * @return {void} 
     */
    construct : function(vUrl, vMethod, vResponseType)
    {
        this.base(arguments, vUrl, vMethod, vResponseType);
        
        this.addListener("changeState", this._onChangeState, this);
        
        this.__attempts = 1;
        
        this.__statusCode = "200";
    },
    
    members:
    {
    	_onChangeState : function(e)
    	{
    		var state = this.getState();
	    	var message = new qx.event.message.Message("ProgressView", state);
	    	message.setSender(this);
			qx.event.message.Bus.dispatch(message);
    	},
    	resend : function()
    	{
    		if (this.__attempts < this.getMaxAttempts())
			{
				var sec = Math.floor(Math.random() * (10000 * this.__attempts) + (500 * this.__attempts));
				
				this.__attempts++;
				
				qx.event.Timer.once( function(){
					this.send();
			    },this, sec);
				
			}
			else
			{
				this.dispose();
			}
    	},
    	_oncompleted : function(e)
    	{
    	      // Modify internal state
    	      this.setState("completed");

    	      // Bubbling up
    	      this.__forwardEvent(e);
    	      
    	      this.dispose();
    	      //this.__statusCode = e.getStatusCode();
    	      
    	},
    	_onaborted : function(e)
        {
          // Modify internal state
          this.setState("aborted");

          // Bubbling up
          this.__forwardEvent(e);
          
          this.resend();
        },
    	_ontimeout : function(e)
        {
          // Modify internal state
          this.setState("timeout");

          // Bubbling up
          this.__forwardEvent(e);
          
          this.resend();
        },
    	_onfailed : function(e)
        {
          // Modify internal state
          this.setState("failed");

          // Bubbling up
          this.__forwardEvent(e);
          
          this.resend();
        }
    }
});