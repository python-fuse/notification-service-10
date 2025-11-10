from marshmallow import Schema, fields

class TemplateSchema(Schema):
    id = fields.UUID(dump_only=True)
    code = fields.Str(required=True)
    name = fields.Str(required=True)
    language = fields.Str()
    description = fields.Str(allow_none=True)
    is_active = fields.Bool()
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

class TemplateVersionSchema(Schema):
    id = fields.UUID(dump_only=True)
    template_id = fields.UUID(required=True)
    version_number = fields.Int(required=True)
    subject = fields.Str(required=True)
    body = fields.Str(required=True)
    created_at = fields.DateTime(dump_only=True)

template_schema = TemplateSchema()
templates_schema = TemplateSchema(many=True)
template_version_schema = TemplateVersionSchema()
template_versions_schema = TemplateVersionSchema(many=True)
