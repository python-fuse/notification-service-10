from jinja2 import Environment, StrictUndefined, TemplateError

# Initialize Jinja2 environment
jinja_env = Environment(
    autoescape=True,
    undefined=StrictUndefined,  # raise errors if variable missing
    trim_blocks=True,
    lstrip_blocks=True,
)

def render_template(template_str: str, variables: dict) -> str:
    """
    Renders a string template with Jinja2 using provided variables.
    Raises TemplateError if rendering fails.
    """
    try:
        template = jinja_env.from_string(template_str)
        return template.render(**variables)
    except TemplateError as e:
        raise ValueError(f"Template rendering error: {e}")
