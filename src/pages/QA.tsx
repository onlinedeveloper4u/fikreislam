 import Layout from "@/components/layout/Layout";
 import { QASection } from "@/components/qa/QASection";
 import { HelpCircle } from "lucide-react";
 
 const QA = () => {
   return (
     <Layout>
       <div className="container mx-auto px-4 py-8">
         <div className="mb-8">
           <div className="flex items-center gap-3 mb-2">
             <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
               <HelpCircle className="w-6 h-6 text-primary-foreground" />
             </div>
             <div>
               <h1 className="text-3xl font-display font-bold text-foreground">
                 Questions & Answers
               </h1>
               <p className="text-muted-foreground">
                 Ask questions and get answers from our community
               </p>
             </div>
           </div>
         </div>
 
         <QASection />
       </div>
     </Layout>
   );
 };
 
 export default QA;