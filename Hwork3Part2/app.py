from flask import Flask, render_template
from routes.user_routes import user_routes
from routes.staff_routes import staff_routes

app = Flask(__name__)

# Register Blueprints
app.register_blueprint(user_routes, url_prefix='/api')
app.register_blueprint(staff_routes, url_prefix='/api')

# Frontend Routes
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/user')
def user_portal():
    return render_template('user.html')

@app.route('/staff')
def staff_portal():
    return render_template('staff.html')

if __name__ == '__main__':
    app.run(debug=True)
