# Generated manually to add fields missing from AbstractBaseUser + PermissionsMixin
# that were never captured in previous migrations.
#
# Missing fields added:
#   password         — from AbstractBaseUser (hashed, default = make_password("password123"))
#   last_login       — from AbstractBaseUser (nullable, no default)
#   is_staff         — defined in model but absent from 0001 migration
#   is_superuser     — from PermissionsMixin
#   groups           — M2M from PermissionsMixin
#   user_permissions — M2M from PermissionsMixin

from django.db import migrations, models


def set_default_password(apps, schema_editor):
    """Populate the new password column for all existing users."""
    from django.contrib.auth.hashers import make_password
    User = apps.get_model('users', 'User')
    User.objects.all().update(password=make_password('password123'))


class Migration(migrations.Migration):

    dependencies = [
        # Latest auth migration — required for M2M to auth.Group / auth.Permission
        ('auth', '0012_alter_user_first_name_max_length'),
        ('users', '0003_alter_user_username'),
    ]

    operations = [
        # --- AbstractBaseUser fields ---
        migrations.AddField(
            model_name='user',
            name='password',
            field=models.CharField(max_length=128, verbose_name='password', default='!'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='user',
            name='last_login',
            field=models.DateTimeField(blank=True, null=True, verbose_name='last login'),
        ),

        # --- Explicit model field missing from 0001 ---
        migrations.AddField(
            model_name='user',
            name='is_staff',
            field=models.BooleanField(
                default=False,
                help_text='Whether the user can access admin interface',
            ),
        ),

        # --- PermissionsMixin fields ---
        migrations.AddField(
            model_name='user',
            name='is_superuser',
            field=models.BooleanField(
                default=False,
                help_text='Designates that this user has all permissions without explicitly assigning them.',
                verbose_name='superuser status',
            ),
        ),
        migrations.AddField(
            model_name='user',
            name='groups',
            field=models.ManyToManyField(
                blank=True,
                help_text='The groups this user belongs to.',
                related_name='user_set',
                related_query_name='user',
                to='auth.group',
                verbose_name='groups',
            ),
        ),
        migrations.AddField(
            model_name='user',
            name='user_permissions',
            field=models.ManyToManyField(
                blank=True,
                help_text='Specific permissions for this user.',
                related_name='user_set',
                related_query_name='user',
                to='auth.permission',
                verbose_name='user permissions',
            ),
        ),

        # --- Populate password for existing rows ---
        migrations.RunPython(set_default_password, migrations.RunPython.noop),
    ]
