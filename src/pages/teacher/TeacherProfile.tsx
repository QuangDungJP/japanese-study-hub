import ProfilePage from '@/pages/learn/Profile';
import ThemeCustomizer from '@/components/theme/ThemeCustomizer';

const TeacherProfilePage = () => {
  return (
    <div className="space-y-6">
      <ProfilePage />
      <ThemeCustomizer />
    </div>
  );
};

export default TeacherProfilePage;
