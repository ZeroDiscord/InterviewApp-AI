import React from 'react';
import LanguageCard from '../components/LanguageCard';

const WelcomePage = ({ onStartInterview, isStarting }) => {
    const languages = ['JavaScript', 'DotNet', 'Python'];

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <div className="text-center mb-12">
                <h1 className="text-5xl font-extrabold text-slate-800">
                    Your AI Interview Copilot
                </h1>
                <p className="text-xl text-slate-600 mt-3 max-w-2xl mx-auto">
                    Choose a topic to start your personalized practice session. Let's build your confidence, one question at a time.
                </p>
            </div>
            
            {isStarting && <p className="text-blue-600 text-lg my-4">Initializing your session...</p>}
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 max-w-4xl w-full">
                {languages.map(lang => (
                    <LanguageCard
                        key={lang}
                        language={lang}
                        onSelect={() => onStartInterview(lang)}
                    />
                ))}
            </div>
        </div>
    );
};

export default WelcomePage;
