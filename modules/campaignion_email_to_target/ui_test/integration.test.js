import {setup, teardown, triggerDragAndDrop} from './test-helper.js'
import find from 'lodash/find'
import sinon from 'sinon'
import 'jasmine-sinon'

import Vue from 'vue'
import app from '../ui_src/app.vue'

import testData from './data/empty-data.js'

describe('messages widget', function() {

  describe('creating a message and an exclusion, changing their order, deleting the exclusion', function() {
    var vm

    beforeAll(function() {
      vm = setup(app, testData)
    })

    afterAll(function() {
      teardown(vm)
    })

    describe('clicking on a tokens header', function() {
      beforeAll(function(done) {
        this.table = $('.tokens-list table').first();
        this.table.find('thead a').dispatch('mousedown');
        vm.$nextTick(function() {
          done()
        })
      })

      it('expands a list of tokens', function(done) {
        expect(this.table.find('tbody').length).not.toBe(0)
        expect(this.table.find('tbody').text()).toContain('[mythirdtoken]')
        done()
      })
    })

    describe('focusing a message field, then clicking a token', function() {
      beforeAll(function(done) {
        $('[id^=message-body]')
        .val('**')
        .trigger('change')
        .focus()
        .selectRange(1);
        $('.tokens-list .token-token a').first().dispatch('mousedown');
        vm.$nextTick(function() {
          done()
        })
      })

      it('inserts the token at cursor position', function(done) {
        expect($('[id^=message-body]').val()).toBe('*[myfirsttoken]*')
        done()
      })
    })

    describe('creating a message template', function() {

      describe('clicking "new message" button', function() {
        beforeAll(function(done) {
          vm.$el.querySelector('.add-message').click()
          setTimeout(function() {
            done()
          }, 500);
        })

        it('shows dialog', function(done) {
          expect(vm.$el.querySelector('#spec-modal')).toHaveClass('in')
          expect(vm.$el.querySelector('#spec-modal h4').textContent).toBe('Add specific Message')
          done()
        })
      })

      describe('save button', function() {
        it('is disabled', function() {
          expect(vm.$el.querySelector('.js-modal-save')).toBeDisabled()
        })
      })

      describe('entering stuff into the form', function() {
        beforeAll(function(done) {
          $('#spec-label').val('my message').trigger('change');
          $('[id^=message-header]', '#spec-modal').val('hi there').trigger('change');
          vm.$nextTick(function() {
            done()
          });
        })

        it('enables save button', function(done) {
          expect(vm.$el.querySelector('.js-modal-save')).not.toBeDisabled()
          done()
        })
      })

      describe('clicking "prefill"', function() {
        beforeAll(function(done) {
          $('.prefill-message').dispatch('click');
          vm.$nextTick(function() {
            done()
          })
        })

        it('prefills empty message fields', function(done) {
          expect($('[id^=message-header]', '#spec-modal').val()).toBe('hi there')
          expect($('[id^=message-body]', '#spec-modal').val()).toBe('*[myfirsttoken]*')
          done()
        })
      })

      describe('clicking "save"', function() {
        beforeAll(function(done) {
          $('.js-modal-save', '#spec-modal').click()
          vm.$nextTick(function() {
            done()
          })
        })

        it('closes the dialog', function() {
          expect(vm.$el.querySelector('#spec-modal')).not.toHaveClass('in')
        })

        it('shows the new message in the list', function() {
          expect($('.specs .spec').length).toBe(1)
          expect($('.specs .spec .spec-label').text().trim()).toBe('my message')
        })

        it('shows a warning about missing filters', function(done) {
          expect($('.specs .spec .spec-errors .spec-error').length).toBe(1)
          expect($('.specs .spec .spec-errors .spec-error').text().trim()).toBe('No filter selected')
          done()
        })
      })

    })

    describe('creating an exclusion', function() {

      describe('clicking "new exclusion" button', function() {
        beforeAll(function(done) {
          vm.$el.querySelector('.add-exclusion').click()
          setTimeout(function() {
            done()
          }, 500);
        })

        it('shows dialog including one textarea and a warning about exclusion order', function(done) {
          var modal = vm.$el.querySelector('#spec-modal'),
          warning = vm.$el.querySelector('.exclusion-warning');

          expect(modal).toHaveClass('in')
          expect(modal.querySelectorAll('.message-editor textarea').length).toBe(1)
          expect(modal.querySelector('h4').textContent).toBe('Add exclusion')
          expect(warning).toBeTruthy()
          expect(warning.textContent).toContain('order')
          done()
        })
      })

      describe('save button', function() {
        it('is disabled', function() {
          expect(vm.$el.querySelector('.js-modal-save')).toBeDisabled()
        })
      })

      describe('entering a label', function() {
        beforeAll(function(done) {
          $('#spec-label').val('my exclusion').trigger('change');
          vm.$nextTick(function() {
            done()
          });
        })

        it('enables save button', function(done) {
          expect(vm.$el.querySelector('.js-modal-save')).not.toBeDisabled()
          done()
        })
      })

      describe('clicking "Add filter"', function() {
        beforeAll(function(done) {
          $('.filter-editor header [data-toggle=dropdown]').click()
          vm.$nextTick(function() {
            done()
          })
        })

        it('shows a dropdown with filters', function(done) {
          expect($('.filter-editor header .dropdown-menu')).toHaveCss({'display': 'block'}) // TODO: toBeVisible would be nicer. The parent modal is not visible in PhantomJS.
          expect($('.filter-editor header .dropdown-menu > li:last a')).toContainText('Political Affiliation')
          done()
        })
      })

      describe('selecting a filter', function() {
        beforeAll(function(done) {
          $('.filter-editor header .dropdown-menu a:contains("Political Affiliation")').dispatch('click')
          vm.$nextTick(function() {
            done()
          })
        })

        it('adds a filter', function(done) {
          expect($('.filter-editor ul.filters')).toContainElement('li.filter')
          expect($('.filter-editor ul.filters > li:first .attribute-label')).toContainText('Political Affiliation')
          done()
        })
      })

      describe('typing letters into the typeahead', function() {
        var server

        beforeAll(function(done) {
          server = sinon.fakeServer.create()

          $('.filter-editor ul.filters > li:first input').val('en').dispatch('input')
          // var event = new Event('input', {'bubbles':false, 'cancelable':false})
          // $('.filter-editor ul.filters > li:first input')[0].dispatchEvent(event)
          setTimeout(() => {
            server.requests[0].respond(
              200,
              { 'Content-Type': 'application/json' },
              JSON.stringify({values: ['Crossbench (Lords)', 'Green Party', 'Independent'], total_items: 3})
            )
          }, 300)
          setTimeout(() => {
            done()
          }, 600)
        })

        afterAll(function() {
          server.restore()
        })

        it('shows a list with highlighted options', function(done) {
          expect($('.filter-editor ul.filters > li:first .typeahead .dropdown-menu > li')).toHaveLength(3)
          expect($('.filter-editor ul.filters > li:first .typeahead .dropdown-menu > li:first').html()).toContain('Crossb<strong>en</strong>ch (Lords)')
          expect($('.filter-editor ul.filters > li:first .typeahead .dropdown-menu > li').eq(1).html()).toContain('Gre<strong>en</strong> Party')
          done()
        })
      })

      describe('clicking a value from the typeahead’s dropdown', function() {
        beforeAll(function(done) {
          $('.filter-editor ul.filters > li:first .typeahead .dropdown-menu > li').eq(1).find('a').dispatch('mousemove').dispatch('mousedown')
          vm.$nextTick(function() {
            done()
          });
        })

        it('sets the filter’s value', function(done) {
          expect($('.filter-editor ul.filters > li:first .typeahead input')).toHaveValue('Green Party')
          expect($('.filter-editor ul.filters > li:first .typeahead .dropdown-menu > li')).toHaveLength(0)
          done()
        })
      })

      describe('clicking "save"', function() {
        beforeAll(function(done) {
          $('.js-modal-save', '#spec-modal').click()
          vm.$nextTick(function() {
            done()
          })
        })

        it('closes the dialog', function() {
          expect(vm.$el.querySelector('#spec-modal')).not.toHaveClass('in')
        })

        it('shows the new exclusion in the list', function() {
          expect($('.specs .spec').length).toBe(2)
          expect($('.specs .spec').last().find('.spec-label').text().trim()).toBe('my exclusion')
        })

        it('shows the exclusion’s filter', function(done) {
          expect($('.specs .spec:last .filter-condition')).toContainText('Political Affiliation is Green Party')
          done()
        })
      })

    })

    describe('dragging the exclusion to the position of the message', function() {
      beforeAll(function(done) {
        this.$specs = $('.specs .spec');
        triggerDragAndDrop(this.$specs[1], this.$specs[0])
        vm.$nextTick(function() {
          done()
        })
      })

      it('changes their order', function(done) {
        expect($('.specs .spec').eq(0).find('.spec-label').text().trim()).toBe('my exclusion')
        expect($('.specs .spec').eq(1).find('.spec-label').text().trim()).toBe('my message')
        done()
      })
    })

    describe('opening the dropdown and choosing delete on the exclusion', function() {
      beforeAll(function(done) {
        var $exclusion = $('.specs .spec').eq(0);
        $exclusion.find('.spec-actions .dropdown-toggle').dispatch('click');
        vm.$nextTick(function() {
          $exclusion.find('.spec-actions .dropdown-menu a:contains("Delete")').dispatch('click')
          setTimeout(function() {
            done()
          }, 500);
        });
      })

      it('shows a confirmation dialog', function(done) {
        expect(vm.$el.querySelector('#alert-modal')).toHaveClass('in')
        expect(vm.$el.querySelector('#alert-modal h4').textContent).toBe('Remove exclusion')
        expect(vm.$el.querySelector('#alert-modal .modal-body').textContent).toContain('my exclusion')
        done()
      })
    })

    describe('clicking "delete" on the dialog', function() {
      beforeAll(function(done) {
        $('#alert-modal button:contains("Remove")').dispatch('click');
        vm.$nextTick(function() {
          done()
        })
      })

      it('removes the exclusion', function(done) {
        expect($('.specs .spec').length).toBe(1)
        expect($('.specs .spec .spec-label').text().trim()).toBe('my message')
        done()
      })
    })

  })
})
