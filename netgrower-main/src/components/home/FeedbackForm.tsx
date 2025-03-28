import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Send, CheckCircle } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { useToast } from '@/components/ui/use-toast';

export const FeedbackForm = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);
    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // EmailJS configuration - Using your updated config
        const serviceId = 'service_b5yd9jl';
        const templateId = 'template_cwt8rhl';
        const publicKey = 'aOTrJ-vOOEhwO0F92';

        emailjs.sendForm(serviceId, templateId, formRef.current!, publicKey)
            .then((result) => {
                console.log('Email sent successfully:', result.text);
                setIsSubmitted(true);
                setIsSubmitting(false);
                if (formRef.current) formRef.current.reset();

                // Show success toast notification
                toast({
                    title: "Feedback Sent!",
                    description: "Thank you for your feedback. We'll get back to you soon.",
                    variant: "default",
                });
            })
            .catch((error) => {
                console.error('Error sending email:', error.text);
                setIsSubmitting(false);

                // Show error toast notification
                toast({
                    title: "Error Sending Feedback",
                    description: "There was a problem sending your feedback. Please try again.",
                    variant: "destructive",
                });
            });
    };

    return (
        <div className="w-full flex justify-center items-center my-8">
            <Card className="w-full max-w-md mx-auto">
                <CardHeader className="text-center">
                    <CardTitle>Send Feedback</CardTitle>
                    <CardDescription>
                        Share your thoughts, suggestions, or report issues with LNCT Connect
                    </CardDescription>
                </CardHeader>

                {isSubmitted ? (
                    <CardContent className="flex flex-col items-center justify-center py-8">
                        <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                        <h3 className="text-xl font-medium">Thank You!</h3>
                        <p className="text-center text-muted-foreground mt-2">
                            Your feedback has been submitted successfully. We appreciate your input!
                        </p>
                        <Button
                            variant="outline"
                            className="mt-6"
                            onClick={() => setIsSubmitted(false)}
                        >
                            Send Another Feedback
                        </Button>
                    </CardContent>
                ) : (
                    <form ref={formRef} onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" name="user_name" placeholder="Your name" required />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="user_email" type="email" placeholder="Your email address" required />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject</Label>
                                <Input id="subject" name="subject" placeholder="Feedback subject" required />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message">Message</Label>
                                <Textarea
                                    id="message"
                                    name="message"
                                    placeholder="Your feedback, suggestions, or issues..."
                                    className="min-h-[120px]"
                                    required
                                />
                            </div>
                        </CardContent>

                        <CardFooter>
                            <Button
                                type="submit"
                                className="w-full gap-2"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>Sending...</>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4" />
                                        Send Feedback
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                )}
            </Card>
        </div>
    );
};