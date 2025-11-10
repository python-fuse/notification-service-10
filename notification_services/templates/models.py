import uuid
from sqlalchemy.dialects.postgresql import UUID
from database import db
from datetime import datetime


class Template(db.Model):
    __tablename__ = 'templates'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = db.Column(db.String(100), unique=True, nullable=False, index=True)
    name = db.Column(db.String(150), nullable=False)
    language = db.Column(db.String(10), nullable=False, default='en')
    description = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    versions = db.relationship("TemplateVersion", back_populates="template")

    def __repr__(self):
        return f'<Template {self.code}>'


class TemplateVersion(db.Model):
    __tablename__ = 'template_versions'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_id = db.Column(UUID(as_uuid=True), db.ForeignKey('templates.id'), nullable=False)
    version_number = db.Column(db.Integer, nullable=False)
    subject = db.Column(db.Text, nullable=True)
    body = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<TemplateVersion {self.template_id} v{self.version_number}>'


    # template = db.relationship("Template", back_populates="versions")
