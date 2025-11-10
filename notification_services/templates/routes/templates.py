from flask import Blueprint, request, jsonify
from template_service.services import template_logic
from template_service.schemas.template_schema import template_schema, template_version_schema

templates_bp = Blueprint('templates_bp', __name__, url_prefix='/templates')

@templates_bp.route('', methods=['POST'])
def create_template():
    data = request.get_json()
    error = template_schema.validate(data)
    if error:
        return jsonify(error), 400
    response, status_code = template_logic.create_template(data)
    return jsonify(response), status_code

@templates_bp.route('', methods=['GET'])
def get_templates():
    response, status_code = template_logic.get_templates()
    return jsonify(response), status_code

@templates_bp.route('/<code>', methods=['GET'])
def get_template(code):
    response, status_code = template_logic.get_template_by_code(code)
    return jsonify(response), status_code

@templates_bp.route('/<code>', methods=['PUT'])
def update_template(code):
    data = request.get_json()
    error = template_schema.validate(data, partial=True)
    if error:
        return jsonify(error), 400
    response, status_code = template_logic.update_template(code, data)
    return jsonify(response), status_code

@templates_bp.route('/<code>', methods=['DELETE'])
def delete_template(code):
    response, status_code = template_logic.delete_template(code)
    return jsonify(response), status_code

@templates_bp.route('/<code>/versions', methods=['POST'])
def create_template_version(code):
    data = request.get_json()
    error = template_version_schema.validate(data)
    if error:
        return jsonify(error), 400
    response, status_code = template_logic.create_template_version(code, data)
    return jsonify(response), status_code

@templates_bp.route('/<code>/versions', methods=['GET'])
def get_template_versions(code):
    response, status_code = template_logic.get_template_versions(code)
    return jsonify(response), status_code

@templates_bp.route('/<code>/versions/<int:version_number>', methods=['GET'])
def get_template_version(code, version_number):
    response, status_code = template_logic.get_template_version(code, version_number)
    return jsonify(response), status_code
