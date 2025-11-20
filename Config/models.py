from Config.db import db
from datetime import datetime
from marshmallow import Schema, fields


class Pickup(db.Model):
    __tablename__ = 'pickups'
    id = db.Column(db.Integer, primary_key=True)
    address = db.Column(db.String(255), nullable=False)
    scheduled_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(50), default='pending')
    created_by = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class PickupSchema(Schema):
    id = fields.Int(dump_only=True)
    address = fields.Str(required=True)
    scheduled_at = fields.DateTime(allow_none=True)
    status = fields.Str()
    created_by = fields.Str(allow_none=True)
    created_at = fields.DateTime()


pickup_schema = PickupSchema()
pickups_schema = PickupSchema(many=True)


class DirectoryEntry(db.Model):
    __tablename__ = 'directory'
    id = db.Column(db.Integer, primary_key=True)
    created_by = db.Column(db.String(255), nullable=True)
    role = db.Column(db.String(50), nullable=True)
    name = db.Column(db.String(255), nullable=False)
    contact = db.Column(db.String(255), nullable=False)
    desc = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class DirectoryEntrySchema(Schema):
    id = fields.Int(dump_only=True)
    created_by = fields.Str(allow_none=True)
    role = fields.Str()
    name = fields.Str()
    contact = fields.Str()
    desc = fields.Str(allow_none=True)
    created_at = fields.DateTime()

directory_schema = DirectoryEntrySchema()
directories_schema = DirectoryEntrySchema(many=True)


class Delivery(db.Model):
    __tablename__ = 'deliveries'
    id = db.Column(db.Integer, primary_key=True)
    user_email = db.Column(db.String(255), nullable=True)
    point_id = db.Column(db.Integer, nullable=True)
    points = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class DeliverySchema(Schema):
    id = fields.Int(dump_only=True)
    user_email = fields.Str(allow_none=True)
    point_id = fields.Int(allow_none=True)
    points = fields.Int()
    created_at = fields.DateTime()

delivery_schema = DeliverySchema()
deliveries_schema = DeliverySchema(many=True)


class MapPoint(db.Model):
    __tablename__ = 'map_points'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    lat = db.Column(db.Float, nullable=False)
    lng = db.Column(db.Float, nullable=False)
    types = db.Column(db.String(255), nullable=True)
    open_hours = db.Column(db.String(255), nullable=True)


class MapPointSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str()
    lat = fields.Float()
    lng = fields.Float()
    types = fields.Str(allow_none=True)
    open_hours = fields.Str(allow_none=True)

mappoint_schema = MapPointSchema()
mappoints_schema = MapPointSchema(many=True)
