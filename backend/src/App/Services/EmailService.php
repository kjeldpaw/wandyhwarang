<?php

namespace App\Services;

use App\Config\Config;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

class EmailService
{
    private $mail;

    public function __construct()
    {
        $this->mail = new PHPMailer(true);

        try {
            // Server settings
            $this->mail->isSMTP();
            
            $host = Config::get('mail.host', 'smtp.mailtrap.io');
            $this->mail->Host = $host;
            
            $this->mail->SMTPAuth = true;
            $this->mail->Username = Config::get('mail.username', '');
            $this->mail->Password = Config::get('mail.password', '');
            
            $port = (int)Config::get('mail.port', 2525);
            $this->mail->Port = $port;
            
            // Set encryption based on port
            if ($port === 465) {
                $this->mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
            } else {
                $this->mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            }
            
            // Add SMTPOptions to ignore certificate errors
            $this->mail->SMTPOptions = array(
                'ssl' => array(
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                    'allow_self_signed' => true
                )
            );

            // Set sender
            $from_address = Config::get('mail.from_address', 'noreply@wandyhwarang.com');
            $from_name = Config::get('mail.from_name', 'Wandy Hwarang');
            $this->mail->setFrom($from_address, $from_name);
            
        } catch (Exception $e) {
            error_log("Email service configuration error: {$e->getMessage()}");
            throw new \Exception("Email service configuration error: {$e->getMessage()}");
        }
    }

    /**
     * Send password reset email
     */
    public function sendPasswordResetEmail($email, $name, $resetToken)
    {
        try {
            $resetUrl = Config::get('app.frontend_url', 'http://localhost:8000') . "/reset-password?token=" . urlencode($resetToken);

            $htmlBody = $this->getPasswordResetEmailTemplate($name, $resetUrl);

            $this->mail->addAddress($email);
            $this->mail->isHTML(true);
            $this->mail->Subject = 'Password Reset Request - Wandy Hwarang';
            $this->mail->Body = $htmlBody;
            $this->mail->AltBody = "Click this link to reset your password: $resetUrl";

            $this->mail->send();

            // Clear recipients for next email
            $this->mail->clearAddresses();

            return true;
        } catch (Exception $e) {
            throw new \Exception("Failed to send password reset email: {$e->getMessage()}");
        }
    }

    /**
     * Send registration confirmation email
     */
    public function sendRegistrationConfirmationEmail($email, $confirmationToken)
    {
        try {
            $confirmationUrl = Config::get('app.frontend_url', 'http://localhost:8000') . "/confirm-registration?token=" . urlencode($confirmationToken);

            $htmlBody = $this->getRegistrationConfirmationEmailTemplate($confirmationUrl);

            $this->mail->addAddress($email);
            $this->mail->isHTML(true);
            $this->mail->Subject = 'Confirm Your Registration - Wandy Hwa Rang';
            $this->mail->Body = $htmlBody;
            $this->mail->AltBody = "Click this link to confirm your registration: $confirmationUrl";

            $this->mail->send();

            // Clear recipients for next email
            $this->mail->clearAddresses();

            return true;
        } catch (Exception $e) {
            throw new \Exception("Failed to send registration confirmation email: {$e->getMessage()}");
        }
    }

    /**
     * Get HTML template for password reset email
     */
    private function getPasswordResetEmailTemplate($name, $resetUrl)
    {
        return "
        <html>
            <body style=\"font-family: Arial, sans-serif; color: #333;\">
                <div style=\"max-width: 600px; margin: 0 auto; padding: 20px;\">
                    <h2>Password Reset Request</h2>
                    <p>Hi {$name},</p>
                    <p>We received a request to reset your password. Click the button below to reset it:</p>
                    <div style=\"text-align: center; margin: 30px 0;\">
                        <a href=\"{$resetUrl}\" style=\"background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;\">Reset Password</a>
                    </div>
                    <p>Or copy and paste this link in your browser:</p>
                    <p style=\"word-break: break-all;\">{$resetUrl}</p>
                    <p>This link will expire in 1 hour.</p>
                    <p>If you didn't request a password reset, you can ignore this email.</p>
                    <hr style=\"margin: 30px 0; border: none; border-top: 1px solid #ddd;\">
                    <p style=\"font-size: 12px; color: #666;\">Wandy Hwarang - Taekwondo Management System</p>
                </div>
            </body>
        </html>
        ";
    }

    /**
     * Get HTML template for registration confirmation email
     */
    private function getRegistrationConfirmationEmailTemplate($confirmationUrl)
    {
        return "
        <html>
            <body style=\"font-family: Arial, sans-serif; color: #333;\">
                <div style=\"max-width: 600px; margin: 0 auto; padding: 20px;\">
                    <h2>Welcome to Wandy Hwarang!</h2>
                    <p>Thank you for registering with us. Click the button below to confirm your email and set up your password:</p>
                    <div style=\"text-align: center; margin: 30px 0;\">
                        <a href=\"{$confirmationUrl}\" style=\"background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;\">Confirm Registration</a>
                    </div>
                    <p>Or copy and paste this link in your browser:</p>
                    <p style=\"word-break: break-all;\">{$confirmationUrl}</p>
                    <p>This link will expire in 24 hours.</p>
                    <p>If you didn't create this account, you can safely ignore this email.</p>
                    <hr style=\"margin: 30px 0; border: none; border-top: 1px solid #ddd;\">
                    <p style=\"font-size: 12px; color: #666;\">Wandy Hwarang - Taekwondo Management System</p>
                </div>
            </body>
        </html>
        ";
    }
}
