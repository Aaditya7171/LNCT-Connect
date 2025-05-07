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
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="hidden lg:flex lg:w-1/2 bg-cover bg-center relative overflow-hidden">
        {/* Purple engaging background with animated gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
          {/* Decorative blobs with animations */}
          <div className="absolute top-[10%] right-[10%] w-[30vw] h-[30vw] rounded-full bg-purple-700/30 blur-3xl animate-pulse-slow"
            style={{ animationDuration: '15s' }} />
          <div className="absolute bottom-[20%] left-[15%] w-[25vw] h-[25vw] rounded-full bg-indigo-700/30 blur-3xl animate-pulse-slow"
            style={{ animationDuration: '20s', animationDelay: '2s' }} />
          <div className="absolute top-[40%] left-[5%] w-[15vw] h-[15vw] rounded-full bg-violet-800/30 blur-3xl animate-pulse-slow"
            style={{ animationDuration: '25s', animationDelay: '1s' }} />

          {/* Pattern overlay */}
          <div className="absolute inset-0 opacity-[0.05] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48cGF0aCBkPSJNMzAgMGMxNi41NjkgMCAzMCAxMy40MzEgMzAgMzBTNDYuNTY5IDYwIDMwIDYwIDAgNDYuNTY5IDAgMzAgMTMuNDMxIDAgMzAgMHptMCA1Yy0xMy44MDcgMC0yNSAxMS4xOTMtMjUgMjVzMTEuMTkzIDI1IDI1IDI1IDI1LTExLjE5MyAyNS0yNS0xMS4xOTMtMjUtMjUtMjV6IiBmaWxsPSIjQTc4QkZBIiBmaWxsLXJ1bGU9Im5vbnplcm8iIG9wYWNpdHk9Ii4zIi8+PC9zdmc+')]" />
        </div>

        <div className="flex flex-col justify-center items-start p-12 relative z-10 w-full h-full text-white">
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200 animate-fade-in" style={{ animationDuration: '1s' }}>LNCT Connect</h1>
          <p className="text-2xl mb-8 animate-fade-in" style={{ animationDuration: '1.2s', animationDelay: '0.2s' }}>Lakshmi Narain College of Technology, Indore</p>
          <div className="glass-card-gradient p-8 rounded-xl backdrop-blur-md border border-white/20 shadow-2xl animate-fade-in" style={{ animationDuration: '1.5s', animationDelay: '0.4s' }}>
            <p className="text-xl mb-6 leading-relaxed">"Education to Execution - Transforming students into industry-ready professionals through excellence in education, innovation, and practical learning."</p>
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 mr-4 flex items-center justify-center">
                <span className="text-white font-bold">LNCT</span>
              </div>
              <div>
                <p className="font-semibold text-lg">LNCT Indore</p>
                <p className="text-sm text-purple-200">Established 1994</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <Card className="w-full max-w-md glass-card-gradient backdrop-blur-md border border-white/10 dark:border-gray-800/30 shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 animate-fade-in" style={{ animationDuration: '0.8s' }}>
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105">
                <span className="text-2xl text-white font-bold">LC</span>
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-500 animate-fade-in" style={{ animationDuration: '1s', animationDelay: '0.2s' }}>Welcome to LNCT Connect</CardTitle>
            <CardDescription className="text-gray-400 dark:text-gray-300 mt-2 animate-fade-in" style={{ animationDuration: '1.2s', animationDelay: '0.4s' }}>
              Your gateway to the LNCT community
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full animate-fade-in" style={{ animationDuration: '1.4s', animationDelay: '0.6s' }}>
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-800/50 dark:bg-gray-800/50 p-1 rounded-lg">
                <TabsTrigger value="login" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white transition-all duration-300">Login</TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white transition-all duration-300">Sign Up</TabsTrigger>
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
                              <FiMail className="absolute left-3 top-3 text-purple-400" />
                              <Input
                                placeholder="you@example.com"
                                className="pl-10 bg-gray-800/50 border-gray-700/50 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300"
                                {...field}
                              />
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
                              <FiLock className="absolute left-3 top-3 text-purple-400" />
                              <Input
                                type="password"
                                placeholder="••••••"
                                className="pl-10 bg-gray-800/50 border-gray-700/50 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 transform hover:translate-y-[-2px] active:translate-y-[0px]"
                      disabled={loading}
                    >
                      {loading ? 'Signing in...' : 'Sign in'}
                      {!loading && <FiArrowRight className="ml-2 animate-bounce-x" />}
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
                              <FiUser className="absolute left-3 top-3 text-purple-400" />
                              <Input
                                id="fullName"
                                type="text"
                                placeholder="John Doe"
                                className="pl-10 bg-gray-800/50 border-gray-700/50 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300"
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
                              <FiMail className="absolute left-3 top-3 text-purple-400" />
                              <Input
                                type="email"
                                placeholder="you@example.com"
                                className="pl-10 bg-gray-800/50 border-gray-700/50 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300"
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
                              <FiLock className="absolute left-3 top-3 text-purple-400" />
                              <Input
                                type="password"
                                placeholder="••••••"
                                className="pl-10 bg-gray-800/50 border-gray-700/50 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 transform hover:translate-y-[-2px] active:translate-y-[0px]"
                      disabled={loading}
                    >
                      {loading ? 'Creating account...' : 'Create account'}
                      {!loading && <FiArrowRight className="ml-2 animate-bounce-x" />}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 border-t border-gray-700/30 pt-4 animate-fade-in" style={{ animationDuration: '1.6s', animationDelay: '0.8s' }}>
            <div className="text-sm text-center text-gray-400 dark:text-gray-300">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </div>
            <div className="text-xs text-center text-gray-500 dark:text-gray-400">
              © 2025 LNCT Connect - Lakshmi Narain College of Technology, Indore
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
