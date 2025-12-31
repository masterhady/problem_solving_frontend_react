import DashboardSidebar from "@/components/DashboardSidebar";
import { Card } from "@/components/ui/card";
import { BookOpen, Info, HelpCircle } from "lucide-react";

const Glossary = () => {
    const terms = [
        {
            id: "difficulty-coverage",
            titleEn: "Difficulty Coverage",
            titleAr: "تغطية الصعوبة",
            descriptionEn: "Measures the balance of problems solved across different difficulty levels (Easy, Medium, Hard). A higher score indicates a more well-rounded problem solver.",
            descriptionAr: "يقيس التوازن في حل المسائل عبر مستويات الصعوبة المختلفة (سهل، متوسط، صعب). تشير الدرجة الأعلى إلى حل مسائل أكثر شمولاً.",
            weight: "100"
        },
        {
            id: "solution-quality",
            titleEn: "Solution Quality",
            titleAr: "جودة الحلول",
            descriptionEn: "Evaluates the efficiency and correctness of solutions, often based on the weighted acceptance rate and the complexity of problems solved.",
            descriptionAr: "يقيم كفاءة وصحة الحلول، غالباً بناءً على معدل القبول المرجح وتعقيد المسائل المحلولة.",
            weight: "100"
        },
        {
            id: "consistency",
            titleEn: "Consistency",
            titleAr: "الاستمرارية",
            descriptionEn: "Tracks how regularly the user practices. It considers the current streak and the frequency of submissions over time.",
            descriptionAr: "يتتبع مدى انتظام المستخدم في التدريب. يأخذ في الاعتبار السلسلة الحالية وتكرار التقديمات بمرور الوقت.",
            weight: "100"
        },
        {
            id: "volume-ranking",
            titleEn: "Volume & Ranking",
            titleAr: "الحجم والتصنيف",
            descriptionEn: "Reflects the total number of problems solved and the user's global ranking on LeetCode.",
            descriptionAr: "يعكس إجمالي عدد المسائل المحلولة والتصنيف العالمي للمستخدم على LeetCode.",
            weight: "100"
        },
        {
            id: "community-engagement",
            titleEn: "Community Engagement",
            titleAr: "المشاركة المجتمعية",
            descriptionEn: "Measures interaction with the community, such as reputation points, contest participation, and contributions.",
            descriptionAr: "يقيس التفاعل مع المجتمع، مثل نقاط السمعة والمشاركة في المسابقات والمساهمات.",
            weight: "100"
        },
        {
            id: "problem-solving-score",
            titleEn: "Problem Solving Score",
            titleAr: "درجة حل المشكلات",
            descriptionEn: "A comprehensive score (out of 100) that combines all the above metrics to provide an overall assessment of technical proficiency.",
            descriptionAr: "درجة شاملة (من 100) تجمع بين جميع المقاييس المذكورة أعلاه لتقديم تقييم عام للكفاءة التقنية.",
            weight: "100"
        }
    ];

    return (
        <div className="flex min-h-screen bg-background">
            <DashboardSidebar type="company" />
            <main className="flex-1 p-8">
                <div className="max-w-4xl mx-auto animate-fade-in">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                            <BookOpen className="w-10 h-10 text-primary" />
                            Glossary & Metrics
                        </h1>
                        <p className="text-muted-foreground">
                            Understanding the key performance indicators used in LeetCode Profile Analysis
                        </p>
                    </div>

                    <div className="grid gap-6">
                        {terms.map((term) => (
                            <Card key={term.id} className="p-6 gradient-card shadow-soft hover:shadow-md transition-shadow">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-xl font-bold text-primary">{term.titleEn}</h3>
                                            <span className="text-muted-foreground">/</span>
                                            <h3 className="text-xl font-bold text-primary" dir="rtl">{term.titleAr}</h3>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6 mt-4">
                                            <div>
                                                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                                                    <HelpCircle className="w-4 h-4" /> English
                                                </p>
                                                <p className="text-foreground leading-relaxed">
                                                    {term.descriptionEn}
                                                </p>
                                            </div>
                                            <div dir="rtl">
                                                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2 justify-end">
                                                    العربية <HelpCircle className="w-4 h-4" />
                                                </p>
                                                <p className="text-foreground leading-relaxed font-arabic">
                                                    {term.descriptionAr}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center justify-center bg-primary/10 rounded-xl p-4 min-w-[100px]">
                                        <span className="text-xs font-bold text-primary uppercase tracking-tighter">Score Scale</span>
                                        <span className="text-2xl font-black text-primary">{term.weight}</span>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    <Card className="mt-8 p-6 bg-secondary/30 border-dashed border-2 border-primary/20">
                        <div className="flex items-start gap-4">
                            <Info className="w-6 h-6 text-primary shrink-0 mt-1" />
                            <div>
                                <h4 className="font-bold mb-1">How is the score calculated?</h4>
                                <p className="text-sm text-muted-foreground">
                                    The Problem Solving Score is a weighted average of all metrics. Each metric is normalized based on industry standards and peer benchmarks to ensure a fair and accurate assessment of skills.
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default Glossary;
