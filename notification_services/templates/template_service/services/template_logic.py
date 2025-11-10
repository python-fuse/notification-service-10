from models import Template, TemplateVersion
from database import db
from template_service.schemas.template_schema import template_schema, templates_schema, template_version_schema, template_versions_schema
from sqlalchemy.exc import IntegrityError

def create_template(data):
    try:
        new_template = Template(
            code=data['code'],
            name=data['name'],
            language=data.get('language', 'en'),
            description=data.get('description')
        )
        db.session.add(new_template)
        db.session.commit()
        return template_schema.dump(new_template), 201
    except IntegrityError:
        db.session.rollback()
        return {"message": "Template with this code already exists."}, 409
    except Exception as e:
        db.session.rollback()
        return {"message": str(e)}, 500

def get_templates():
    templates = Template.query.all()
    return templates_schema.dump(templates), 200

def get_template_by_code(code):
    template = Template.query.filter_by(code=code).first()
    if not template:
        return {"message": "Template not found."}, 404
    return template_schema.dump(template), 200

def update_template(code, data):
    template = Template.query.filter_by(code=code).first()
    if not template:
        return {"message": "Template not found."}, 404
    
    try:
        template.name = data.get('name', template.name)
        template.language = data.get('language', template.language)
        template.description = data.get('description', template.description)
        template.is_active = data.get('is_active', template.is_active)
        db.session.commit()
        return template_schema.dump(template), 200
    except Exception as e:
        db.session.rollback()
        return {"message": str(e)}, 500

def delete_template(code):
    template = Template.query.filter_by(code=code).first()
    if not template:
        return {"message": "Template not found."}, 404
    
    try:
        db.session.delete(template)
        db.session.commit()
        return {"message": "Template deleted successfully."}, 200
    except Exception as e:
        db.session.rollback()
        return {"message": str(e)}, 500

def create_template_version(code, data):
    template = Template.query.filter_by(code=code).first()
    if not template:
        return {"message": "Template not found."}, 404

    try:
        # Get the latest version number and increment it
        latest_version = TemplateVersion.query.filter_by(template_id=template.id).order_by(TemplateVersion.version_number.desc()).first()
        new_version_number = (latest_version.version_number + 1) if latest_version else 1

        new_version = TemplateVersion(
            template_id=template.id,
            version_number=new_version_number,
            subject=data['subject'],
            body=data['body']
        )
        db.session.add(new_version)
        db.session.commit()
        return template_version_schema.dump(new_version), 201
    except Exception as e:
        db.session.rollback()
        return {"message": str(e)}, 500

def get_template_versions(code):
    template = Template.query.filter_by(code=code).first()
    if not template:
        return {"message": "Template not found."}, 404
    
    versions = TemplateVersion.query.filter_by(template_id=template.id).all()
    return template_versions_schema.dump(versions), 200

def get_template_version(code, version_number):
    template = Template.query.filter_by(code=code).first()
    if not template:
        return {"message": "Template not found."}, 404
    
    version = TemplateVersion.query.filter_by(template_id=template.id, version_number=version_number).first()
    if not version:
        return {"message": "Version not found."}, 404
        
    return template_version_schema.dump(version), 200
