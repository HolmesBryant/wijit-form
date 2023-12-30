# Wijit Form Web Component #

This component serves simply as a convenience to make styling forms and configuring waiting effects and confirmation/error messages less time consuming.</p>

## Features ##

- Set custom "waiting", "success" and "error" messages.
- Custom messages can be set by either attributes or slots.
- Receive and display messages from the server sent in HTML or JSON format.
- Set whether the messages appear as a modal.
- Set custom http headers and other fetch options, such as CORS etc.
- Set whether to reset the form when it is submitted.
- Use the component's default css to style to form, or use your own styles.

## Usage ##
Add the script to your page:
		
	<script type="module" src="/wijit-form.js"></script>

Add the tag around your form:
	
	<wijit-form>
		<form action="/some/url/">...</form>
	</wijit-form>

## Description of Features ##

### Custom Messages ###

Instead of displaying whatever message the server sends, you may wish to display your own "waiting", "success" and/or "error" messages. You may set these messages by either attributes or slots. 

If you don't set a "waiting", "success" and/or "error" message, the message that is displayed depends on the "response" attribute. If it is set to "json" (default), the component's default message will display. If "response" is set to "html", the response from the server is displayed.

**If the server returns an HTML response and you simply wish to display whatever the server sends, you must set  the "response" attribute to "html".**

		<wijit-form response="html">...</wijit-form>

#### Custom Message via Attributes ####

To set custom messages with attributes:

	<wijit-form waiting="<h1>Waiting Message</h1>" success="<h2>Success</h2><p>message</p>" error="error message">...</wijit-form>

#### Custom Message via Slots ####

To set custom messages with slots:

	<wijit-form>  
		<form>...</form>   
		<div slot="waiting" class="animated-icon"></div>   
		<div slot="success"><h1>Success!</h1><p>Thank You</p></div>  
		<p slot="error">An error occured :(</p>
	</wijit-form>

If the server/script to which you submit the form returns responses in JSON format, you have the option to include placeholders in your custom "success" or "error" messages" which map to specific bits of data in the response.

For example, if the server sends back JSON data in the form of:

	{  
		"status":"success",  
		"message":"Thank You",  
		"data": {  
			"name": "Foo"  
		}
	}

You can write your custom success message as:

	<wijit-form success="{{message}} {{data.name}}">...</wijit-form>

Or 

	<wijit-form>  
		<form>...</form>  
		<div slot="success"><h1>{{status}}</h1><p>Thanks {{data.name}}</p></div>
	</wijit-form>

Since "json" is the default value of the "response" property, you don't need to add a "response" attribute manually.

### Modal vs Non-modal ###

You may also set whether the messages appear as a modal. If you add the "modal" attribute, an overlay will appear over the entire screen and the waiting/success/error message will appear centered in the screen. If the modal attribute is absent, or if it is set to "false", the waiting/success/error messages will only appear over the form which was submitted.

To enable a modal dialog:

	<wijit-form modal>...</wijit-form>

### Custom Fetch Options ###

This web component intercepts the form submission and sends the request to the server via fetch(). You may need to set custom http headers or other fetch options such as CORS directives. These options should be written in valid JSON syntax.

You do not need to set an "Accept" header. This is done automatically with the "response" attribute. If the value of "response" is "html" the "Accept" header is set to "text/html". If the value of the "response" attribute is "json" (default), the Accept header is set to "application/json".

To set a custom http header:

	<wijit-form 
		fetch-options="{headers:{"X-Requested-With":"XMLHttpRequest"}}">  
		...  
	</wijit-form>

If you have many custom fetch options, you may want to add them with javascript.

	<script>
		const component = document.querySelector("wijit-form");
		// options should be a String!
		const options = `{  
			headers: {...},
			mode: "cors",
			cache: "default"
		}`;
		component.setAttribute('fetch-options', options);
	</script>
				
### Do Not Reset Form on Submission

By default, the form will reset on submission, if you do not want the form to reset, add the "reset" attribute with a value of "false".

	<wijit-form reset="false">...</wijit-form>


## Attributes ##

All of these attributes are optional

- **fetch-options (default: null)** Acceptable values: [Any valid fetch option from: <a target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/API/fetch#options">The MDN Docs</a>]. This should be formatted as valid JSON.

- User Supplied Confirmation Messages. These attributes accept strings. The string may contain HTML.

      - **waiting (default: null)** Acceptable values: [any string] This is the message displayed after the form is submitted, while the page is waiting for a response from the server.

      - **success (default: null)** Acceptable values: [any string] This is the message displayed upon a successful response from the server, meaning the server sent an http status code lower than 400.

      - **error (default: null)** Acceptable values: [any string] This is the message displayed when the server reports an error, meaning it sent an http status code greater than 399.

 
- **response (default: "json")** Acceptable values: ["html", "json"] The Content Type expected from the server.

- **modal (default: "false")** Acceptable values: ["true", "false"] Whether to open the confirmation dialog as a modal. A modal dialog/overlay covers the entire screen. When this value is false, the confirmation dialog/overlay only covers the form which was submitted.

- **reset (default: "true")** Acceptable value: ["true", "false"] Whether to reset the form after it is submitted.