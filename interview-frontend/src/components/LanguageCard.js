import React from 'react';

const LanguageCard = ({ language, onSelect }) => {
    return (
        <div 
            className="bg-white shadow-lg rounded-xl p-6 text-center cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-2xl hover:bg-blue-500 group"
            onClick={onSelect}
        >
            <h3 className="text-2xl font-bold text-slate-700 group-hover:text-white transition-colors">
                {language}
            </h3>
        </div>
    );
};

export default LanguageCard;
