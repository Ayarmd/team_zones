import { Camera, User } from "lucide-react";
import { roleLabel } from "../../employees/data/employeeMeta";
import "../pages/ProfilePage.css";

/** واجهة الملف الشخصي المشتركة (عرض فقط) */
export default function ProfileView({
  user,
  loading,
  fullName,
  setFullName,
  email,
  setEmail,
  phone,
  setPhone,
  avatar,
  msg,
  onAvatarPick,
  saveProfile,
  openChangePasswordFlow,
  onDeleteAccount,
}) {
  if (loading) {
    return (
      <div className="profile-page profile-page--loading">
        <p>جاري تحميل الملف الشخصي...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-page">
        <p className="profile-msg profile-msg--err">تعذر تحميل بيانات الحساب. سجّل الدخول مرة أخرى.</p>
      </div>
    );
  }

  return (
    <div className="profile-page" dir="rtl">
      <section className="neon-card profile-hero">
        <div className="profile-hero__meta">
          <h2>{fullName || "مستخدم"}</h2>
          <p dir="ltr">{email}</p>
          <p>{roleLabel(user.role)}</p>
        </div>
        <div className="profile-avatar-wrap">
          {avatar ? (
            <img src={avatar} alt="" className="profile-avatar" />
          ) : (
            <div className="profile-avatar profile-avatar--placeholder">
              <User size={32} aria-hidden />
            </div>
          )}
          <label className="profile-avatar-upload">
            <Camera size={14} aria-hidden />
            رفع صورة
            <input type="file" accept="image/*" onChange={onAvatarPick} />
          </label>
        </div>
      </section>

      <section className="neon-card profile-card">
        <h3 className="profile-card__title">تعديل البيانات</h3>
        {msg.text ? (
          <p className={`profile-msg profile-msg--${msg.type === "ok" ? "ok" : "err"}`}>{msg.text}</p>
        ) : null}
        <form className="profile-form-grid" onSubmit={saveProfile}>
          <div>
            <label htmlFor="pf-name">الاسم الكامل</label>
            <input
              id="pf-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="pf-email">البريد الإلكتروني</label>
            <input
              id="pf-email"
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="pf-phone">رقم الهاتف</label>
            <input
              id="pf-phone"
              type="tel"
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+218 ..."
            />
          </div>
          <div className="profile-form-actions">
            <button type="submit" className="primary-btn">
              حفظ التعديلات
            </button>
          </div>
        </form>
      </section>

      <section className="neon-card profile-card">
        <h3 className="profile-card__title">كلمة المرور</h3>
        <p className="profile-card__hint">لتغيير كلمة المرور، اضغط الزر أدناه واتبع الخطوات.</p>
        <div className="profile-form-actions profile-form-actions--start">
          <button type="button" className="primary-btn" onClick={openChangePasswordFlow}>
            تغيير كلمة المرور
          </button>
        </div>
      </section>

      <section className="neon-card profile-card profile-danger-zone">
        <div className="profile-delete-row">
          <p className="profile-delete-hint">
            إذا كنت تريد حذف حسابك نهائياً، اضغط هنا. لا يمكن التراجع بعد الحذف.
          </p>
          <button type="button" className="zones-btn zones-btn--danger profile-delete-btn" onClick={onDeleteAccount}>
            حذف الحساب
          </button>
        </div>
      </section>
    </div>
  );
}
