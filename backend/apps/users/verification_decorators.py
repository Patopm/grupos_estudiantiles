from functools import wraps

from django.http import JsonResponse
from rest_framework import status
from rest_framework.response import Response

from .verification_models import UserVerificationStatus, VerificationRequirement


def require_verification(operation):
    """
    Decorator to enforce verification requirements for specific operations

    Usage:
        @require_verification('password_change')
        def change_password_view(request):
            # View logic here
            pass
    """

    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # Check if user is authenticated
            if not request.user.is_authenticated:
                return Response(
                    {"error": "Authentication required"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            # Check verification requirements
            verification_required, verification_type = (
                VerificationRequirement.check_verification_required(
                    operation, request.user
                )
            )

            if verification_required:
                # Get user verification status
                verification_status, _ = UserVerificationStatus.get_or_create_for_user(
                    request.user
                )

                # Generate appropriate error message
                if verification_type == "email":
                    message = "Se requiere verificación de email para esta operación"
                elif verification_type == "phone":
                    message = "Se requiere verificación de teléfono para esta operación"
                elif verification_type == "both":
                    if not verification_status.email_verified:
                        message = (
                            "Se requiere verificación de email para esta operación"
                        )
                    else:
                        message = (
                            "Se requiere verificación de teléfono para esta operación"
                        )
                elif verification_type == "account":
                    message = "Se requiere cuenta completamente verificada para esta operación"
                else:
                    message = "Se requiere verificación adicional para esta operación"

                return Response(
                    {
                        "error": message,
                        "verification_required": True,
                        "verification_type": verification_type,
                        "user_verification_status": {
                            "email_verified": verification_status.email_verified,
                            "phone_verified": verification_status.phone_verified,
                            "account_verified": verification_status.account_verified,
                            "is_fully_verified": verification_status.is_fully_verified,
                        },
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Verification passed, proceed with the view
            return view_func(request, *args, **kwargs)

        return wrapper

    return decorator


def require_email_verification(view_func):
    """
    Decorator to require email verification

    Usage:
        @require_email_verification
        def some_view(request):
            # View logic here
            pass
    """

    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        verification_status, _ = UserVerificationStatus.get_or_create_for_user(
            request.user
        )

        if not verification_status.email_verified:
            return Response(
                {
                    "error": "Se requiere verificación de email para esta operación",
                    "verification_required": True,
                    "verification_type": "email",
                    "user_verification_status": {
                        "email_verified": verification_status.email_verified,
                        "phone_verified": verification_status.phone_verified,
                        "account_verified": verification_status.account_verified,
                        "is_fully_verified": verification_status.is_fully_verified,
                    },
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        return view_func(request, *args, **kwargs)

    return wrapper


def require_phone_verification(view_func):
    """
    Decorator to require phone verification

    Usage:
        @require_phone_verification
        def some_view(request):
            # View logic here
            pass
    """

    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        verification_status, _ = UserVerificationStatus.get_or_create_for_user(
            request.user
        )

        if not verification_status.phone_verified:
            return Response(
                {
                    "error": "Se requiere verificación de teléfono para esta operación",
                    "verification_required": True,
                    "verification_type": "phone",
                    "user_verification_status": {
                        "email_verified": verification_status.email_verified,
                        "phone_verified": verification_status.phone_verified,
                        "account_verified": verification_status.account_verified,
                        "is_fully_verified": verification_status.is_fully_verified,
                    },
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        return view_func(request, *args, **kwargs)

    return wrapper


def require_full_verification(view_func):
    """
    Decorator to require full account verification

    Usage:
        @require_full_verification
        def some_view(request):
            # View logic here
            pass
    """

    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        verification_status, _ = UserVerificationStatus.get_or_create_for_user(
            request.user
        )

        if not verification_status.is_fully_verified:
            # Determine what verification is missing
            missing_verifications = []
            if (
                verification_status.email_verification_required
                and not verification_status.email_verified
            ):
                missing_verifications.append("email")
            if (
                verification_status.phone_verification_required
                and not verification_status.phone_verified
            ):
                missing_verifications.append("phone")

            if missing_verifications:
                verification_type = missing_verifications[
                    0
                ]  # Return first missing verification
                if verification_type == "email":
                    message = "Se requiere verificación de email para completar la verificación de cuenta"
                else:
                    message = "Se requiere verificación de teléfono para completar la verificación de cuenta"
            else:
                verification_type = "account"
                message = (
                    "Se requiere cuenta completamente verificada para esta operación"
                )

            return Response(
                {
                    "error": message,
                    "verification_required": True,
                    "verification_type": verification_type,
                    "missing_verifications": missing_verifications,
                    "user_verification_status": {
                        "email_verified": verification_status.email_verified,
                        "phone_verified": verification_status.phone_verified,
                        "account_verified": verification_status.account_verified,
                        "is_fully_verified": verification_status.is_fully_verified,
                        "verification_progress": verification_status.verification_progress,
                    },
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        return view_func(request, *args, **kwargs)

    return wrapper


class VerificationRequiredMixin:
    """
    Mixin for class-based views to enforce verification requirements

    Usage:
        class MyView(VerificationRequiredMixin, APIView):
            verification_operation = 'password_change'

            def post(self, request):
                # View logic here
                pass
    """

    verification_operation = None

    def dispatch(self, request, *args, **kwargs):
        if not self.verification_operation:
            raise ValueError("verification_operation must be specified")

        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Check verification requirements
        verification_required, verification_type = (
            VerificationRequirement.check_verification_required(
                self.verification_operation, request.user
            )
        )

        if verification_required:
            verification_status, _ = UserVerificationStatus.get_or_create_for_user(
                request.user
            )

            # Generate appropriate error message
            if verification_type == "email":
                message = "Se requiere verificación de email para esta operación"
            elif verification_type == "phone":
                message = "Se requiere verificación de teléfono para esta operación"
            elif verification_type == "both":
                if not verification_status.email_verified:
                    message = "Se requiere verificación de email para esta operación"
                else:
                    message = "Se requiere verificación de teléfono para esta operación"
            elif verification_type == "account":
                message = (
                    "Se requiere cuenta completamente verificada para esta operación"
                )
            else:
                message = "Se requiere verificación adicional para esta operación"

            return Response(
                {
                    "error": message,
                    "verification_required": True,
                    "verification_type": verification_type,
                    "user_verification_status": {
                        "email_verified": verification_status.email_verified,
                        "phone_verified": verification_status.phone_verified,
                        "account_verified": verification_status.account_verified,
                        "is_fully_verified": verification_status.is_fully_verified,
                    },
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        return super().dispatch(request, *args, **kwargs)
