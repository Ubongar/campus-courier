import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GraduationCap, Store, Bike, ChevronRight } from "lucide-react";

const GetStarted = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const cardVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 12,
      },
    },
    hover: {
      y: -10,
      scale: 1.02,
      boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
      borderColor: "rgba(var(--primary), 0.5)",
      transition: { duration: 0.3 },
    },
  };

  const handleSelection = (role: string) => {
    // Navigate to auth with the selected role state
    // Note: You may need to update Auth.tsx to read this state if you want to auto-select the role
    navigate("/auth", { state: { role, tab: "signup" } });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 p-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="hover:bg-muted/50 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>
      </nav>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-6 py-12 flex flex-col justify-center items-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 max-w-2xl"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Path</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Select how you'll be using the Campus Food Delivery System today.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl"
        >
          {/* Student Card */}
          <motion.div
            variants={cardVariants}
            whileHover="hover"
            onClick={() => handleSelection("student")}
            className="group cursor-pointer bg-card border border-border/50 rounded-3xl p-8 flex flex-col items-center text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
              <GraduationCap className="h-10 w-10 text-primary group-hover:text-white transition-colors" />
            </div>
            
            <h3 className="text-2xl font-bold mb-3">Student</h3>
            <p className="text-muted-foreground mb-8">
              I want to browse menus, order food, and get it delivered to my location.
            </p>
            
            <div className="mt-auto w-full">
              <Button className="w-full group-hover:bg-primary group-hover:text-white" variant="outline">
                Join as Student <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>

          {/* Vendor Card */}
          <motion.div
            variants={cardVariants}
            whileHover="hover"
            onClick={() => handleSelection("vendor")}
            className="group cursor-pointer bg-card border border-border/50 rounded-3xl p-8 flex flex-col items-center text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="h-20 w-20 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-6 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
              <Store className="h-10 w-10 text-orange-500 group-hover:text-white transition-colors" />
            </div>
            
            <h3 className="text-2xl font-bold mb-3">Vendor</h3>
            <p className="text-muted-foreground mb-8">
              I want to list my menu, manage incoming orders, and track my daily sales.
            </p>
            
            <div className="mt-auto w-full">
              <Button className="w-full group-hover:border-orange-500 group-hover:text-orange-500" variant="outline">
                Join as Vendor <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>

          {/* Rider Card */}
          <motion.div
            variants={cardVariants}
            whileHover="hover"
            onClick={() => handleSelection("rider")}
            className="group cursor-pointer bg-card border border-border/50 rounded-3xl p-8 flex flex-col items-center text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="h-20 w-20 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
              <Bike className="h-10 w-10 text-blue-500 group-hover:text-white transition-colors" />
            </div>
            
            <h3 className="text-2xl font-bold mb-3">Rider</h3>
            <p className="text-muted-foreground mb-8">
              I want to accept delivery requests, navigate the campus, and earn.
            </p>
            
            <div className="mt-auto w-full">
              <Button className="w-full group-hover:border-blue-500 group-hover:text-blue-500" variant="outline">
                Join as Rider <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center"
        >
          <p className="text-muted-foreground">
            Already have an account?{" "}
            <a href="/auth" className="text-primary font-semibold hover:underline">
              Sign In
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default GetStarted;