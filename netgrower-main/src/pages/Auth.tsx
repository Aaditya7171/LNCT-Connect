import { checkUserExists, loginUser, registerUser } from '@/services/api/auth';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { FiMail, FiLock, FiUser, FiArrowRight } from 'react-icons/fi';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Form validation schemas
const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

const signupSchema = z.object({
  fullName: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("login");
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const returnUrl = location.state?.returnUrl || '/';

  // Fix the premature redirection issue
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    // Only redirect if both token and userId exist
    if (token && userId) {
      navigate('/');
    }
  }, [navigate]);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
    },
    mode: "onChange",
  });

  // Update the onLoginSubmit function to handle the response correctly
  const onLoginSubmit = async (values: z.infer<typeof loginSchema>) => {
      setLoading(true);
      try {
        const response = await loginUser({
          email: values.email,
          password: values.password,
        });
  
        console.log("Login response:", response);
  
        // Check if response exists and has token
        if (response && response.token) {
          // Don't set localStorage here as it's already done in loginUser
          
          toast({
            title: "Login successful!",
            description: "You have been logged in successfully.",
          });
  
          // Redirect to the return URL or home page
          navigate(returnUrl);
        } else {
          // Handle case where token is missing in response
          throw new Error("Authentication failed - no token received");
        }
      } catch (error: any) {
        console.error("Login error details:", error);
        toast({
          variant: "destructive",
          title: "Login failed",
          description: error.message || "Invalid email or password. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

  const onSignupSubmit = async (values: z.infer<typeof signupSchema>) => {
    console.log("Form values submitted:", values);
    console.log("Full name value:", values.fullName);
    setLoading(true);
    try {
      // First check if user exists
      const userExists = await checkUserExists(values.email);

      if (userExists) {
        toast({
          variant: "destructive",
          title: "Email already in use",
          description: "This email is already registered. Please log in instead.",
        });
        setActiveTab("login");
        setLoading(false);
        return;
      }

      // Register the user
      const response = await registerUser({
        name: values.fullName,
        email: values.email,
        password: values.password,
      });

      console.log("Registration response:", response.data);

      // Store user data in localStorage
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userId', response.data.user.id);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('isNewUser', 'true');
      }

      toast({
        title: "Account created!",
        description: "Your account has been created successfully. Let's set up your profile.",
      });

      // Redirect to profile edit page for new users
      navigate('/profile');
    } catch (error: any) {
      console.error("Signup error details:", error);
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: error.response?.data?.message || "An error occurred during signup. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="hidden lg:flex lg:w-1/2 bg-cover bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80')" }}>
        <div className="flex flex-col justify-center items-start p-12 bg-black bg-opacity-40 w-full h-full text-white">
          <h1 className="text-4xl font-bold mb-4">LNCT Connect</h1>
          <p className="text-xl mb-8">Join the community of LNCT students and alumni</p>
          <div className="bg-white/20 p-6 rounded-lg backdrop-blur-sm">
            <p className="text-lg mb-4">"LNCT Connect helped me stay in touch with my college friends and find new opportunities."</p>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary mr-3 flex items-center justify-center">
                <span className="text-white font-bold">RK</span>
              </div>
              <div>
                <p className="font-semibold">Rahul Kumar</p>
                <p className="text-sm">CSE, Batch of 2022</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <Card className="w-full max-w-md border-none shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <div className="w-12 h-12 rounded-md bg-primary flex items-center justify-center">
                <span className="text-xl text-primary-foreground font-bold">LC</span>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Welcome to LNCT Connect</CardTitle>
            <CardDescription>
              Your platform to connect with LNCT community
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <FiMail className="absolute left-3 top-3 text-muted-foreground" />
                              <Input placeholder="you@example.com" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <FiLock className="absolute left-3 top-3 text-muted-foreground" />
                              <Input type="password" placeholder="••••••" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Signing in...' : 'Sign in'}
                      {!loading && <FiArrowRight className="ml-2" />}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="signup">
                <Form {...signupForm}>
                  <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
                    <FormField
                      control={signupForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <FiUser className="absolute left-3 top-3 text-muted-foreground" />
                              <Input
                                id="fullName"
                                type="text"
                                placeholder="John Doe"
                                className="pl-10"
                                onChange={(e) => {
                                  console.log("Name input changed:", e.target.value);
                                  field.onChange(e.target.value);
                                }}
                                value={field.value}
                                onBlur={field.onBlur}
                                name="fullName"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <FiMail className="absolute left-3 top-3 text-muted-foreground" />
                              <Input
                                type="email"
                                placeholder="you@example.com"
                                className="pl-10"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <FiLock className="absolute left-3 top-3 text-muted-foreground" />
                              <Input type="password" placeholder="••••••" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Creating account...' : 'Create account'}
                      {!loading && <FiArrowRight className="ml-2" />}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 border-t pt-4">
            <div className="text-sm text-center text-muted-foreground">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
