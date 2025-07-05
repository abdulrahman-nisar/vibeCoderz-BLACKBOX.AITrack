from flask import Flask, render_template, request, jsonify, url_for

import os
import time
import re
from werkzeug.utils import secure_filename
from api import groq_ai, ollama_ai

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Create uploads directory if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate', methods=['POST'])
def generate_prototype():
    try:
        prompt = request.form.get('prompt', '')
        ai_model = request.form.get('ai_model', 'groq')
        
        # Handle file upload
        uploaded_file = None
        if 'file' in request.files:
            file = request.files['file']
            if file and file.filename != '' and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(file_path)
                uploaded_file = filename
        
        # Process with AI
        if not prompt:
            return jsonify({'error': 'Please provide a prompt'}), 400
        
        # Enhanced prompt for web application prototype generation
        enhanced_prompt = f"""
        Create a complete web application prototype based on this description: {prompt}
        
        Requirements:
        1. Generate a complete HTML file with embedded CSS and JavaScript
        2. Design should be modern and professional for desktop/web browsers
        3. Use modern web UI patterns and components (navigation bars, sidebars, cards, grids, etc.)
        4. Include interactive elements and functionality where appropriate
        5. Use responsive design that works well on desktop, tablet, and mobile devices
        6. Include proper styling for buttons, forms, navigation, headers, footers, content areas
        7. Make it look like a professional web application with proper layout and spacing
        8. Web application should be functional, interactive, and visually appealing
        9. Use appropriate images, icons, and visual elements (you can use placeholder services)
        10. Include real data, information and content to make it realistic
        11. Use JavaScript to add interactivity, animations, and dynamic functionality
        12. Include modern web design trends (clean layouts, proper typography, color schemes, hover effects, etc.)
        13. Make it suitable for desktop browsers with full-width layouts and proper spacing
        14. Use semantic HTML structure and modern CSS techniques (flexbox, grid, etc.)
        15. Include proper viewport meta tag for responsive design
        16. Make the interface intuitive and user-friendly for web users

        
        Please provide ONLY the complete HTML code with embedded CSS and JavaScript. 
        Start with <!DOCTYPE html> and end with </html>.
        Do not include any explanations or markdown formatting.
        
        {f"Additional context from uploaded file: {uploaded_file}" if uploaded_file else ""}
        """
        
        # Generate response based on selected AI model
        if ai_model == 'groq':
            completion = groq_ai(enhanced_prompt)
            response_text = ""
            for chunk in completion:
                if chunk.choices[0].delta.content:
                    response_text += chunk.choices[0].delta.content
        else:
            response_text = ollama_ai(enhanced_prompt)
        
        # Clean up the response to extract only HTML code
        html_code = extract_html_code(response_text)
        
        # Save the generated prototype
        prototype_filename = f"prototype_{int(time.time())}.html"
        prototype_path = os.path.join('static', 'prototypes', prototype_filename)
        os.makedirs(os.path.dirname(prototype_path), exist_ok=True)
        
        with open(prototype_path, 'w', encoding='utf-8') as f:
            f.write(html_code)
        
        return jsonify({
            'success': True,
            'html_code': html_code,
            'prototype_url': f'/static/prototypes/{prototype_filename}',
            'viewer_url': f'/prototype/{prototype_filename}',
            'uploaded_file': uploaded_file
        })

    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def extract_html_code(text):
    """Extract HTML code from AI response"""
    # Look for HTML content between <!DOCTYPE html> and </html>
    html_match = re.search(r'<!DOCTYPE html>.*?</html>', text, re.DOTALL | re.IGNORECASE)
    if html_match:
        return html_match.group(0)
    
    # Look for HTML content between <html> and </html>
    html_match = re.search(r'<html.*?</html>', text, re.DOTALL | re.IGNORECASE)
    if html_match:
        return f"<!DOCTYPE html>\n{html_match.group(0)}"
    
    # If no complete HTML found, wrap the content
    if '<html' in text.lower() or '<body' in text.lower():
        return text
    else:
        # Create a basic web application template with the generated content
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Web Application Prototype</title>
    <style>
        body {{
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8fafc;
            line-height: 1.6;
            color: #333;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }}
    </style>
</head>
<body>
    <div class="container">
        {text}
    </div>
</body>
</html>"""

@app.route('/prototype/<filename>')
def view_prototype(filename):
    # Construct the path to the prototype file
    prototype_path = os.path.join('static', 'prototypes', filename)
    
    # Check if the file exists
    if not os.path.exists(prototype_path):
        return "Prototype not found", 404
    
    # Read the HTML content
    with open(prototype_path, 'r', encoding='utf-8') as f:
        html_code = f.read()
    
    # Get the URL for the prototype for the iframe
    prototype_url = url_for('static', filename=f'prototypes/{filename}')
    
    return render_template('prototype_viewer.html', html_code=html_code, prototype_url=prototype_url)

if __name__ == '__main__':
    app.run(debug=True)
