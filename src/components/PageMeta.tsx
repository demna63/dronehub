import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface PageMetaProps {
  title?: string;
}

const PageMeta: React.FC<PageMetaProps> = ({ title }) => {
  const location = useLocation();

  useEffect(() => {
    // 1. მთავარი სათაური (იგივე რაც index.html-ში)
    const baseTitle = 'Dronehub';
    
    // 2. მარშრუტების (Routes) თარგმნა ქართულად
    const routeNames: Record<string, string> = {
      '': 'მთავარი',
      'popular': 'პოპულარული',
      'saved': 'შენახული',
      'u': 'მომხმარებელი', // ან "პროფილი"
      'vlogs': 'ვლოგები',
      'chat': 'საერთო ჩატი',
      'regulations': 'რეგულაციები',
      'marketplace': 'მარკეტი',
      'community': 'საზოგადოება',
      'tools': 'ინსტრუმენტები',
      'c': 'კატეგორია'
    };

    if (title) {
      // თუ კონკრეტული სათაური გადმოეცა (მაგ: პოსტის სათაური)
      document.title = `${title} | ${baseTitle}`;
    } else {
      // თუ არ გადმოეცა, ვიღებთ URL-დან
      const pathSegments = location.pathname.split('/');
      const firstSegment = pathSegments[1] || ''; // მაგ: 'vlogs' ან ''
      
      // ვეძებთ შესაბამის ქართულ სახელს, თუ ვერ ვიპოვეთ - ვტოვებთ ინგლისურს (დიდი ასოებით)
      const pageName = routeNames[firstSegment] || 
        (firstSegment ? firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1) : '');

      if (pageName) {
        document.title = `${pageName} | ${baseTitle}`;
      } else {
        document.title = `${baseTitle} - საქართველოს დრონების საზოგადოება`; // მთავარი გვერდის სრული სათაური
      }
    }
  }, [title, location]);

  return null;
};

export default PageMeta;