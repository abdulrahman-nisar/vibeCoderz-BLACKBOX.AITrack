from flask import Flask, render_template, request, jsonify
import os
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
        
        # Add file context to prompt if file was uploaded
        if uploaded_file:
            prompt += f"\n\nNote: User has uploaded a file: {uploaded_file}"
        
        # Generate response based on selected AI model
        if ai_model == 'groq':
            completion = groq_ai(prompt)
            response_text = ""
            for chunk in completion:
                if chunk.choices[0].delta.content:
                    response_text += chunk.choices[0].delta.content
        else:
            response_text = ollama_ai(prompt)
        
        return jsonify({
            'success': True,
            'response': response_text,
            'uploaded_file': uploaded_file
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
