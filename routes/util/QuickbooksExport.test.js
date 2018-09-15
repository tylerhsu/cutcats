import QuickbooksExport from './QuickbooksExport';

describe('QuickbooksExport', function() {
  it('constructor does not throw', function() {
    (() => {
      const periodStart = new Date('2000-1-1');
      const periodEnd = new Date('2000-1-1');
      new QuickbooksExport(periodStart, periodEnd);
    }).should.not.throw();
  });
});
