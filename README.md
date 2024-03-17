# Wijit Form Web Component #

This component serves simply as a convenience to make styling forms and configuring waiting effects and confirmation/error messages less time consuming.

Demo: [https://holmesbryant.github.io/wijit-form/](https://holmesbryant.github.io/wijit-form/)

## Changelog
- v1.01
    - Fixed some css issues
    - Added css for input type="range"
- v1.02
    - changed css variable names:
        - --bg1 to --bg1-color
	    - --bg2 to --bg2-color
	    - --bg3 to --bg3-color
	    - --text to --text-color
	    - --border to --border-color
	    - --fail to --fail-color
	    - --pass to --pass-color
	    - --accent to --accent-color

## Features

- Set custom "waiting", "success" and "error" messages.
- Custom messages can be set by either attributes or slots.
- Receive and display messages from the server sent in HTML or JSON format.
- Choose whether the messages appear as a modal.
- Set custom http headers and other fetch options, such as CORS etc.
- Choose whether to reset the form when it is submitted.
- Use the component's default css to style the form, or use your own styles.

## Usage
Add the script to your page:
		
	<script type="module" src="/wijit-form.js"></script>

Add the tag around your form:
	
	<wijit-form>
		<form action="/some/url/">...</form>
	</wijit-form>


## Custom Messages

Instead of displaying the component's default messages, you can display whatever (HTML) message the server sends or you can display your own **waiting**, **success** and/or **error** messages. You may set these messages by either attributes or slots.

If you don't define a **waiting** message, the component's default message will display.

If you don't define a **success** and/or **error** message, the displayed message depends on the **response** attribute:

- If **response** is set to "json" (default), the component's default message will display.
- If **response** is set to "html", the response from the server is displayed.

If the server typically returns an HTML response and you simply wish to display whatever the server sends, you must set  the **response** attribute to "html".

		<wijit-form response="html">...</wijit-form>

### Custom Message via Attributes

To set custom messages with attributes:

	<wijit-form 
	waiting="<h1>Waiting Message</h1>" 
	success="<h2>Success</h2><p>message</p>" 
	error="error message">
	...
	</wijit-form>

### Custom Message via Slots

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

## Modal vs Non-modal ##

You may also set whether the messages appear as a modal. If you add the "modal" attribute, an overlay will appear over the entire screen and the waiting/success/error message will appear centered in the screen. If the modal attribute is absent, or if it is set to "false", the waiting/success/error messages will only appear over the form which was submitted.

To enable a modal dialog:

	<wijit-form modal>...</wijit-form>

## Custom Fetch Options ##

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
				

OR

	<script>
		customElements.whenDefined('wijit-form')
		.then( () => {
			const elem = document.querySelector('wijit-form');
			elem.fetchOptions = {...};
		});
	</script>

## Reset Form ##

By default, the form will reset on submission, if you do not want the form to reset, add the "reset-form" attribute with a value of "false".

	<wijit-form reset-form="false">...</wijit-form>

## Custom CSS ##

By default, the component styles the form and fields with it's own default css styles. If you wish to use your own styles, add this attribute. You may give the attribute a value of "true", or you may omit the value.

	<wijit-form custom-css>...</wijit-form>


## Attributes ##

All of these attributes are optional

- **fetch-options** (default: null)
    - Acceptable values: [Any valid fetch option from: <a target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/API/fetch#options">The MDN Docs</a>].
    - This should be formatted as a valid JSON string.

- **Confirmation Messages.** These attributes accept strings. The string may contain HTML.

  - **waiting** (default: "`<h1>Please Wait...</h1>`")
      - Acceptable values: [any string]
      - This is the message displayed after the form is submitted, while the page is waiting for a response from the server.

   - **success** (default: "`<h3>Submission Received</h3><p>Thank you!</p>`")
       - Acceptable values: [any string]
       - This is the message displayed upon a successful response from the server, meaning the server sent an http status code lower than 400.

   - **error** (default: "`<h3>Oopsie!</h3><p>There was an error. Your submission was not received.</p>`")
       - Acceptable values: [any string]
       - This is the message displayed when the server reports an error, meaning it sent an http status code greater than 399.

 
- **response** (default: "json")
    - Acceptable values: ["html", "json"]
    - The Content Type expected from the server.

- **modal** (default: "false")
    - Acceptable values: ["true", "false"]
    - Whether to open the confirmation dialog as a modal. A modal dialog/overlay covers the entire screen. When this value is false, the confirmation dialog/overlay only covers the form which was submitted.

- **reset-form** (default: "true")
    - Acceptable values: ["true", "false"]
    - Whether to reset the form after it is submitted.

- **custom-css** (default: "false")
    - Acceptable values: ["true", "false"]
    - Whether to use your own custom css styles on the form instead of the default styles.
