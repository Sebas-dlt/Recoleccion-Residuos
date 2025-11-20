
from flask import Flask, request, jsonify, redirect, session, render_template, abort
from Config.db import app
import secrets
from functools import wraps
from Config.models import Pickup

# Configuración de la clave secreta para las sesiones
app.secret_key = 'tu_clave_secreta_aqui'

# Definición de usuarios y roles
USERS = {
    "admin@admin.com": {"password": "admin123", "role": "admin"},
    "user@user.com": {"password": "user123", "role": "user"},
    "driver@driver.com": {"password": "driver123", "role": "driver"}
}

# Ruta principal que redirige según el rol
@app.route("/")
def index():
    if 'user_role' not in session:
        return redirect("/login")
    return redirect(f"/dashboard/{session['user_role']}")

# Decorador para proteger rutas
def login_required(allowed_roles=None):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user_role' not in session:
                return redirect('/login')
            if allowed_roles and session['user_role'] not in allowed_roles:
                abort(403)
            return f(*args, **kwargs)
        return decorated_function
    return decorator

@app.route("/main")
@login_required()
def main():
    if 'user_role' in session:
        return redirect(f"/dashboard/{session['user_role']}")
    return redirect("/login")

@app.route("/login")
def login():
    token = generete_csrf_token()
    return render_template("views/login.html", csrf_token = token)


def generete_csrf_token():
    if 'csrf_token' not in session:
        session['csrf_token'] = secrets.token_urlsafe(32)
    return session['csrf_token']

def validar_csrf(token_from_request):
    token_session = session.get('csrf_token')
    return token_session and secrets.compare_digest(token_session, token_from_request or "")

@app.route("/submit", methods=['POST'])
def submit():
    token = request.headers.get('X-CSRF-Token') or request.form.get('csrf_token')
    if not validar_csrf(token):
        abort(403, description="CSRF Token Invalido")
    
    email = request.form.get('exampleInputEmail')
    password = request.form.get('exampleInputPassword')
    
    if email in USERS and USERS[email]["password"] == password:
        session['user_role'] = USERS[email]["role"]
        session['user_email'] = email
        return jsonify({
            "status": 200,
            "url": f"/dashboard/{USERS[email]['role']}"
        })
    else:
        return jsonify({
            "status": 401,
            "message": "Credenciales inválidas"
        })

@app.route("/dashboard/admin")
@login_required(['admin'])
def admin_dashboard():
    return render_template("views/admin_dashboard.html")

@app.route("/dashboard/user")
@login_required(['user'])
def user_dashboard():
    return render_template("views/user_dashboard.html")

@app.route("/dashboard/driver")
@login_required(['driver'])
def driver_dashboard():
    return render_template("views/driver_dashboard.html")

@app.route("/logout")
def logout():
    session.clear()
    return redirect('/login')


# Página para gestionar pickups (interfaz JS)
@app.route('/pickups')
def pickups_page():
    # Redirect to the appropriate dashboard section depending on user role
    if 'user_role' not in session:
        return redirect('/login')
    role = session.get('user_role')
    return redirect(f"/dashboard/{role}#pickups")


@app.context_processor
def inject_pickups_count():
    try:
        count = Pickup.query.count()
    except Exception:
        count = ''
    return {'pickups_count': count}

if __name__ == "__main__":
    # Import api to ensure API blueprint is registered
    try:
        import api
    except Exception:
        pass
    app.run(debug=True, port=5000, host='0.0.0.0')