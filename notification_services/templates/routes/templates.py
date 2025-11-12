# routes/templates.py
from flask import Blueprint, request, jsonify
from database import db
from models import Template, TemplateVersion
from utils.templater import render_template
from datetime import datetime

template_bp = Blueprint('template_bp', __name__)


# ✅ Create a new template (and version 1)
@template_bp.route('/', methods=['POST'])
def create_template():
    data = request.get_json()

    required_fields = ['code', 'name', 'body']
    for field in required_fields:
        if field not in data:
            return jsonify({"success": False, "error": f"Missing field: {field}"}), 400

    # Check for existing code
    if Template.query.filter_by(code=data['code']).first():
        return jsonify({"success": False, "error": "Template code already exists"}), 409

    template = Template(
        code=data['code'],
        name=data['name'],
        description=data.get('description'),
        language=data.get('language', 'en')
    )
    db.session.add(template)
    db.session.flush()  # get template.id before commit

    version = TemplateVersion(
        template_id=template.id,
        version_number=1,
        subject=data.get('subject'),
        body=data['body']
    )
    db.session.add(version)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Template created successfully",
        "data": {
            "code": template.code,
            "version_number": version.version_number
        }
    }), 201


# ✅ List all templates
@template_bp.route('/', methods=['GET'])
def list_templates():
    templates = Template.query.all()
    data = []
    for t in templates:
        data.append({
            "code": t.code,
            "name": t.name,
            "language": t.language,
            "is_active": t.is_active,
            "latest_version": len(t.versions)
        })

    return jsonify({"success": True, "data": data, "message": "Templates fetched"}), 200


# ✅ Get template details (latest version)
@template_bp.route('/<string:code>', methods=['GET'])
def get_template(code):
    template = Template.query.filter_by(code=code).first()
    if not template:
        return jsonify({"success": False, "error": "Template not found"}), 404

    latest_version = max(template.versions, key=lambda v: v.version_number, default=None)
    return jsonify({
        "success": True,
        "data": {
            "code": template.code,
            "name": template.name,
            "language": template.language,
            "description": template.description,
            "is_active": template.is_active,
            "latest_version": {
                "version_number": latest_version.version_number if latest_version else None,
                "subject": latest_version.subject if latest_version else None,
                "body": latest_version.body if latest_version else None,
            }
        },
        "message": "Template fetched successfully"
    }), 200


# ✅ Get specific version of a template
@template_bp.route('/<string:code>/<int:version_number>', methods=['GET'])
def get_template_version(code, version_number):
    template = Template.query.filter_by(code=code).first()
    if not template:
        return jsonify({"success": False, "error": "Template not found"}), 404

    version = TemplateVersion.query.filter_by(template_id=template.id, version_number=version_number).first()
    if not version:
        return jsonify({"success": False, "error": "Version not found"}), 404

    return jsonify({
        "success": True,
        "data": {
            "code": template.code,
            "name": template.name,
            "language": template.language,
            "description": template.description,
            "is_active": template.is_active,
            "version": {
                "version_number": version.version_number,
                "subject": version.subject,
                "body": version.body,
                "created_at": version.created_at,
                "updated_at": version.updated_at
            }
        },
        "message": "Template version fetched successfully"
    }), 200



# ✅ Update (create new version)
@template_bp.route('/<string:code>', methods=['PUT'])
def update_template(code):
    template = Template.query.filter_by(code=code).first()
    if not template:
        return jsonify({"success": False, "error": "Template not found"}), 404

    data = request.get_json()
    if 'body' not in data:
        return jsonify({"success": False, "error": "Missing 'body' for new version"}), 400

    latest_version = max(template.versions, key=lambda v: v.version_number, default=None)
    new_version_number = (latest_version.version_number + 1) if latest_version else 1

    new_version = TemplateVersion(
        template_id=template.id,
        version_number=new_version_number,
        subject=data.get('subject'),
        body=data['body']
    )
    db.session.add(new_version)
    template.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        "success": True,
        "message": f"New version {new_version_number} created for template '{code}'",
        "data": {"version_number": new_version_number}
    }), 200


# ✅ Soft delete
@template_bp.route('/<string:code>', methods=['DELETE'])
def delete_template(code):
    template = Template.query.filter_by(code=code).first()
    if not template:
        return jsonify({"success": False, "error": "Template not found"}), 404

    template.is_active = False
    db.session.commit()

    return jsonify({
        "success": True,
        "message": f"Template '{code}' deactivated successfully"
    }), 200

# ✅ Render endpoint (ad-hoc or stored templates)
@template_bp.route('/render', methods=['POST'])
def render_template_endpoint():
    """
    Render a template either from a raw template string or from a stored template and version.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400

        variables = data.get('variables', {})
        template_str = data.get('template_str')
        template_code = data.get('template_code')
        version_number = data.get('version_number')

        # Case 1: Inline template rendering
        if template_str:
            rendered = render_template(template_str, variables)
            return jsonify({
                "success": True,
                "data": {
                    "rendered": rendered,
                    "source": "inline",
                    "variables": variables
                },
                "message": "Inline template rendered successfully"
            }), 200

        # Case 2: Database template rendering
        if template_code:
            template = Template.query.filter_by(code=template_code, is_active=True).first()
            if not template:
                return jsonify({"success": False, "error": f"Template '{template_code}' not found"}), 404

            # Fetch version (latest or specific)
            if version_number:
                version = TemplateVersion.query.filter_by(template_id=template.id, version_number=version_number).first()
                if not version:
                    return jsonify({"success": False, "error": f"Version {version_number} not found for template '{template_code}'"}), 404
            else:
                # Get latest version
                version = max(template.versions, key=lambda v: v.version_number, default=None)
                if not version:
                    return jsonify({"success": False, "error": f"No versions found for template '{template_code}'"}), 404

            # Render body using Jinja2
            rendered = render_template(version.body, variables)

            return jsonify({
                "success": True,
                "data": {
                    "rendered": rendered,
                    "template_code": template_code,
                    "version_number": version.version_number,
                    "variables": variables
                },
                "message": "Template rendered successfully from database"
            }), 200

        # Neither provided
        return jsonify({
            "success": False,
            "error": "Either 'template_str' or 'template_code' must be provided"
        }), 400

    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        return jsonify({
            "success": False,
            "error": "Internal server error",
            "details": str(e)
        }), 500