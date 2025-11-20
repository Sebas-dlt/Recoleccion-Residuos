from flask import request, jsonify, Blueprint, session
from Config.db import app, db
from Config.models import Pickup, pickup_schema, pickups_schema
from Config.models import (
    DirectoryEntry, directory_schema, directories_schema,
    Delivery, delivery_schema, deliveries_schema,
    MapPoint, mappoint_schema, mappoints_schema
)
import json
import os

bp = Blueprint('api', __name__)

@bp.route('/api/pickups', methods=['GET'])
def list_pickups():
    role = session.get('user_role')
    email = session.get('user_email')
    query = Pickup.query
    # Admin sees all
    if role == 'admin' or not role:
        query = query
    elif role == 'user':
        # users see their own pickups
        query = query.filter(Pickup.created_by == email)
    elif role == 'driver':
        # drivers see pending pickups
        query = query.filter(Pickup.status == 'pending')
    pickups = query.order_by(Pickup.created_at.desc()).all()
    return jsonify(pickups_schema.dump(pickups)), 200


@bp.route('/api/pickups/count', methods=['GET'])
def pickups_count():
    role = session.get('user_role')
    email = session.get('user_email')
    query = Pickup.query
    if role == 'admin' or not role:
        query = query
    elif role == 'user':
        query = query.filter(Pickup.created_by == email)
    elif role == 'driver':
        query = query.filter(Pickup.status == 'pending')
    count = query.count()
    return jsonify({'count': count}), 200


# Directory endpoints
@bp.route('/api/directory', methods=['GET'])
def list_directory():
    role = session.get('user_role')
    email = session.get('user_email')
    query = DirectoryEntry.query
    if role == 'admin' or not role:
        query = query
    else:
        # show all for now, but flag created_by
        query = query
    items = query.order_by(DirectoryEntry.created_at.desc()).all()
    return jsonify(directories_schema.dump(items)), 200


@bp.route('/api/directory', methods=['POST'])
def create_directory():
    data = request.get_json() or {}
    name = data.get('name')
    contact = data.get('contact')
    role_field = data.get('role')
    desc = data.get('desc')
    if not name or not contact:
        return jsonify({'message': 'name and contact required'}), 400
    entry = DirectoryEntry(name=name, contact=contact, role=role_field, desc=desc)
    try:
        entry.created_by = session.get('user_email')
    except Exception:
        pass
    db.session.add(entry)
    db.session.commit()
    return jsonify(directory_schema.dump(entry)), 201


# Map points
@bp.route('/api/points', methods=['GET'])
def list_points():
    pts = MapPoint.query.all()
    # if empty, return sample defaults (do not persist here)
    if not pts:
        sample = [
            { 'id': 1, 'name':'Punto Verde Central', 'lat': -0.915, 'lng': -78.615, 'types':'plástico,papel', 'open_hours':'8:00-17:00'},
            { 'id': 2, 'name':'Punto Recicla Norte', 'lat': -0.912, 'lng': -78.607, 'types':'vidrio,metal', 'open_hours':'9:00-16:00'},
            { 'id': 3, 'name':'Punto Comunitario La Plaza', 'lat': -0.919, 'lng': -78.620, 'types':'orgánico,papel', 'open_hours':'7:00-19:00'},
        ]
        return jsonify(sample), 200
    return jsonify(mappoints_schema.dump(pts)), 200


# Deliveries and gamification
@bp.route('/api/deliveries', methods=['GET'])
def list_deliveries():
    role = session.get('user_role')
    email = session.get('user_email')
    q = Delivery.query
    if role == 'admin' or not role:
        q = q
    else:
        q = q.filter(Delivery.user_email == email)
    items = q.order_by(Delivery.created_at.desc()).all()
    return jsonify(deliveries_schema.dump(items)), 200


@bp.route('/api/deliveries', methods=['POST'])
def create_delivery():
    data = request.get_json() or {}
    point_id = data.get('point_id')
    points = int(data.get('points') or 10)
    user_email = session.get('user_email')
    if not user_email:
        return jsonify({'message': 'not authenticated'}), 401
    d = Delivery(point_id=point_id, points=points, user_email=user_email)
    db.session.add(d)
    db.session.commit()
    app.logger.info('Delivery created: %s by %s', d.id if hasattr(d, 'id') else '?', user_email)
    return jsonify(delivery_schema.dump(d)), 201


@bp.route('/api/gamification', methods=['GET'])
def gamification():
    email = session.get('user_email')
    if not email:
        return jsonify({'message':'not authenticated'}), 401
    total_points = db.session.query(db.func.coalesce(db.func.sum(Delivery.points), 0)).filter(Delivery.user_email == email).scalar()
    total_deliveries = Delivery.query.filter(Delivery.user_email == email).count()
    # simple achievements logic (same as client)
    achievements = []
    if total_deliveries >= 1: achievements.append('first')
    if total_deliveries >= 5: achievements.append('five')
    if total_points >= 200: achievements.append('collector')
    return jsonify({'email': email, 'points': int(total_points or 0), 'deliveries': total_deliveries, 'achievements': achievements}), 200

@bp.route('/api/pickups/<int:pk>', methods=['GET'])
def get_pickup(pk):
    pickup = Pickup.query.get_or_404(pk)
    return jsonify(pickup_schema.dump(pickup)), 200

@bp.route('/api/pickups', methods=['POST'])
def create_pickup():
    data = request.get_json() or {}
    address = data.get('address')
    scheduled_at = data.get('scheduled_at')
    if not address:
        return jsonify({'message': 'address is required'}), 400
    p = Pickup(address=address)
    # associate with current user if available
    try:
        if session.get('user_email'):
            p.created_by = session.get('user_email')
    except Exception:
        pass
    db.session.add(p)
    db.session.commit()
    return jsonify(pickup_schema.dump(p)), 201

@bp.route('/api/pickups/<int:pk>', methods=['PUT'])
def update_pickup(pk):
    pickup = Pickup.query.get_or_404(pk)
    # authorization: only admin or creator may update
    role = session.get('user_role')
    user_email = session.get('user_email')
    if role != 'admin' and pickup.created_by and pickup.created_by != user_email:
        return jsonify({'message': 'forbidden'}), 403
    data = request.get_json() or {}
    address = data.get('address')
    status = data.get('status')
    if address is not None:
        pickup.address = address
    if status is not None:
        pickup.status = status
    db.session.commit()
    app.logger.info('Pickup %s updated by %s', pk, user_email)
    return jsonify(pickup_schema.dump(pickup)), 200

@bp.route('/api/pickups/<int:pk>', methods=['DELETE'])
def delete_pickup(pk):
    pickup = Pickup.query.get_or_404(pk)
    # authorization: only admin or creator may delete
    role = session.get('user_role')
    user_email = session.get('user_email')
    if role != 'admin' and pickup.created_by and pickup.created_by != user_email:
        return jsonify({'message': 'forbidden'}), 403
    db.session.delete(pickup)
    db.session.commit()
    app.logger.info('Pickup %s deleted by %s', pk, user_email)
    return jsonify({'message': 'deleted'}), 200

# Register blueprint with the app
app.register_blueprint(bp)


# Simple profile endpoint (uses session set at login)
@bp.route('/api/profile', methods=['GET'])
def profile():
    role = session.get('user_role')
    email = session.get('user_email')
    if not role:
        return jsonify({'message': 'not authenticated'}), 401
    return jsonify({'email': email, 'role': role}), 200


# Support messages (write to a json file)
SUPPORT_FILE = os.path.join(os.path.dirname(__file__), '..', 'support_messages.json')

@bp.route('/api/support', methods=['POST'])
def support():
    data = request.get_json() or {}
    name = data.get('name')
    email = data.get('email')
    message = data.get('message')
    if not message:
        return jsonify({'message': 'message is required'}), 400
    entry = {'name': name, 'email': email, 'message': message}
    try:
        # Append to file
        if os.path.exists(SUPPORT_FILE):
            with open(SUPPORT_FILE, 'r', encoding='utf-8') as f:
                arr = json.load(f) or []
        else:
            arr = []
        arr.append(entry)
        with open(SUPPORT_FILE, 'w', encoding='utf-8') as f:
            json.dump(arr, f, ensure_ascii=False, indent=2)
    except Exception as e:
        return jsonify({'message': 'failed to save support message', 'error': str(e)}), 500
    return jsonify({'message': 'received'}), 201
