export default function AdminLoading() {
  return (
    <div className="admin-page" role="status" aria-busy="true" aria-label="Loading">
      <div>
        <div className="admin-skeleton" style={{ height: '2.4rem', width: 'min(16rem, 70%)' }} />
        <div className="admin-skeleton" style={{ height: '1rem', width: 'min(28rem, 90%)', marginTop: '.8rem' }} />
      </div>
      <div className="admin-skeleton" style={{ height: '2.6rem', width: 'min(26rem, 100%)' }} />
      <div className="admin-skeleton" style={{ height: '18rem' }} />
    </div>
  );
}
